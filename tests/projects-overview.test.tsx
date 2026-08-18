import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectsOverview } from "@/components/dashboard/projects-overview";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProjectsOverview project deletion", () => {
  it("requires confirmation and removes the project after a successful request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              projects: [
                {
                  id: "project-1",
                  name: "Семейная пекарня",
                  slug: "bakery",
                  status: "DRAFT",
                  updatedAt: "2026-07-31T10:00:00.000Z",
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, data: { projectId: "project-1" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectsOverview />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Удалить проект «Семейная пекарня»",
      }),
    );
    expect(
      screen.getByRole("alertdialog", { name: "Удалить проект?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Удалить навсегда" }));

    await waitFor(() => {
      expect(screen.queryByText("Семейная пекарня")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/projects/project-1", {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    expect(screen.getByText("Создайте первый сайт")).toBeInTheDocument();
  });
});
