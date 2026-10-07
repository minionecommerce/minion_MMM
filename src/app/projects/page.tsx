import { can, requirePageAccess } from "@/lib/auth";
import { getLayout } from "@/lib/records/layout";
import { listProjects, parseProjectParams, projectFilterLists } from "@/lib/projects/list";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

// Projects: the deals that were converted with Convert to Project (MP1, MP2, ...). Each row opens the project's page.
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["projects"]);
  const params = parseProjectParams(await searchParams);
  const [data, lists, layout] = await Promise.all([listProjects(ctx, params), projectFilterLists(), getLayout("project")]);
  // the columns a Super Admin added to the Project section of Edit Page Layout and made list columns
  const extraColumns = layout.columns.flatMap(k => {
    const f = layout.fields.find(x => x.key === k);
    return f && !f.isSystem ? [{ key: f.key, label: f.label }] : [];
  });

  return (
    <ProjectsClient
      data={data}
      params={params}
      lists={lists}
      layout={layout}
      extraColumns={extraColumns}
      abilities={{ export: can(ctx, "projects", "export"), layout: ctx.isSuperAdmin }}
    />
  );
}
