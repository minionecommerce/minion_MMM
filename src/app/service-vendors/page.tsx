import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The Material and Service Vendor lists are one list now: Vendors, filtered by Vendor Type. The old address keeps working.
export default function Page() {
  redirect("/vendors?type=service");
}
