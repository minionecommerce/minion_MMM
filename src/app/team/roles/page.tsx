import { redirect } from "next/navigation";

// Roles moved to User Management
export default function RolesRedirect() {
  redirect("/users/roles");
}
