import { prisma } from "./src/lib/db";
import { getEffectivePermissions } from "./src/lib/auth";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@minion.com" }
  });
  if (user) {
    const perms = await getEffectivePermissions(user.id);
    console.log("Found perms:", perms.length);
  }
}
main();
