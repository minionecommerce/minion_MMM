import { redirect } from "next/navigation";

// Roles moved to User Management
export default async function RoleRedirect({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  redirect(`/users/roles/${encodeURIComponent(roleId)}`);
}
