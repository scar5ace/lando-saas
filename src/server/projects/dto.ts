import type { ProjectStatus } from "@/generated/prisma/enums";
import type { PageSchema } from "@/types/page-schema";

export type ProjectSummaryDto = {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  updatedAt: string;
};

export type ProjectListDto = {
  projects: ProjectSummaryDto[];
};

export type CreatedProjectDto = {
  project: ProjectSummaryDto;
  page: {
    revision: number;
  };
};

export type ProjectDetailDto = {
  project: ProjectSummaryDto;
  page: {
    schema: PageSchema;
    revision: number;
    publishedAt: string | null;
  };
};
