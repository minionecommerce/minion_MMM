import { requirePageAccess } from "@/lib/auth";

// The course page is a client component, so the server-side check lives here
export default async function CourseLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(["learning"]);
  return children;
}
