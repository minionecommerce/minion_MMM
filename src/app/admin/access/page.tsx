import { redirect } from "next/navigation";

export default function AccessRoot() {
  redirect("/users");
}
