import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transaction = {
    project: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  };
  return {
    transaction,
    db: {
      $transaction: vi.fn(
        async (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    },
  };
});

vi.mock("@/lib/db/client", () => ({ db: mocks.db }));

import { deleteProjectForUser } from "@/server/projects/service";

describe("deleteProjectForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only an owned project and records an audit event", async () => {
    mocks.transaction.project.findFirst.mockResolvedValue({
      id: "project-1",
      name: "Пекарня",
      slug: "bakery",
      status: "DRAFT",
    });
    mocks.transaction.project.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteProjectForUser("user-1", "project-1")).resolves.toEqual({
      projectId: "project-1",
    });

    expect(mocks.transaction.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-1", userId: "user-1" },
      }),
    );
    expect(mocks.transaction.project.deleteMany).toHaveBeenCalledWith({
      where: { id: "project-1", userId: "user-1" },
    });
    expect(mocks.transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "project.deleted" }),
      }),
    );
  });

  it("does not delete a project that does not belong to the user", async () => {
    mocks.transaction.project.findFirst.mockResolvedValue(null);

    await expect(
      deleteProjectForUser("user-2", "project-1"),
    ).rejects.toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    expect(mocks.transaction.project.deleteMany).not.toHaveBeenCalled();
    expect(mocks.transaction.auditLog.create).not.toHaveBeenCalled();
  });
});
