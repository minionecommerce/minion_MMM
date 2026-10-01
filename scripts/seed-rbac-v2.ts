// Bootstraps the first Super Admin. Safe to re-run: never changes an existing
// user's password or role. Run scripts/rbac-sync.ts first for the permission catalog.
//
//   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='<strong password>' npx tsx scripts/seed-rbac-v2.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { passwordProblems } from "../src/lib/password-policy";

const prisma = new PrismaClient();

async function main() {
  const superAdminRole =
    (await prisma.role.findFirst({ where: { OR: [{ key: "super_admin" }, { isSuperAdmin: true }] } })) ??
    (await prisma.role.create({
      data: { key: "super_admin", name: "SUPER_ADMIN", description: "Full system access", isActive: true, isSuperAdmin: true, isSystem: true },
    }));

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.log("Super Admin role ready. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin account.");
    return;
  }

  const existing = await prisma.user.findFirst({ where: { email: { equals: adminEmail, mode: "insensitive" } } });
  if (existing) {
    console.log(`${adminEmail} already exists; leaving its password and role unchanged.`);
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const problems = passwordProblems(adminPassword);
  if (problems.length) {
    throw new Error(`ADMIN_PASSWORD does not meet the password policy: ${problems.join(", ")}`);
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || "Administrator",
      password: await bcrypt.hash(adminPassword, 12),
      roleId: superAdminRole.id,
      status: "ACTIVE",
      passwordChangedAt: new Date(),
      employee: { create: { designation: "Administrator", department: "Management" } },
    },
  });
  console.log(`Created Super Admin ${adminEmail}.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
