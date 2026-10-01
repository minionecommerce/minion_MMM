import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const roles = [
  {
    name: "SUPER_ADMIN",
    permissions: [
      // ALL Permissions
      "crm.view", "crm.create", "crm.edit", "crm.delete", "crm.assign", "crm.export",
      "projects.view", "projects.create", "projects.edit", "projects.delete", "projects.assign", "projects.financial",
      "tasks.view", "tasks.create", "tasks.edit", "tasks.assign", "tasks.complete", "tasks.delete",
      "team.view", "team.create", "team.edit", "team.hr_sensitive",
      "learning.view", "learning.create", "learning.assign", "learning.assess", "learning.verify",
      "rewards.view", "rewards.create", "rewards.approve", "rewards.adjust_points", "rewards.manage_rules",
      "resources.view", "resources.create", "resources.edit", "resources.delete", "resources.share", "resources.manage_permissions",
      "finance.view", "finance.create", "finance.approve", "finance.export",
      "parks.view", "parks.create", "parks.edit", "parks.delete"
    ]
  },
  {
    name: "SALES",
    permissions: [
      "crm.view", "crm.create", "crm.edit", "crm.assign",
      "tasks.view", "tasks.create", "tasks.edit", "tasks.complete",
      "learning.view",
      "rewards.view",
      "resources.view"
    ]
  },
  {
    name: "EMPLOYEE",
    permissions: [
      "tasks.view", "tasks.complete",
      "team.view",
      "learning.view",
      "rewards.view",
      "resources.view"
    ]
  }
];

async function main() {
  console.log("Seeding RBAC...");

  // Seed Roles
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name }
    });
    
    for (const p of r.permissions) {
      const [module, action] = p.split(".");
      if (!module || !action) continue;
      const perm = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action, description: p }
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: { effect: "ALLOW", scope: "ALL" },
        create: { roleId: role.id, permissionId: perm.id, effect: "ALLOW", scope: "ALL" }
      });
    }
  }

  // Ensure an Admin User exists
  const adminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  
  if (adminRole) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@minion.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { 
        password: hashedPassword,
        roleId: adminRole.id
      },
      create: {
        email: adminEmail,
        name: "Admin User",
        password: hashedPassword,
        roleId: adminRole.id
      }
    });

    // Ensure Employee record exists for Admin
    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        designation: "System Administrator"
      }
    });

    console.log(`Admin user seeded: ${adminEmail}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
