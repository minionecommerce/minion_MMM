import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const modules = [
  "My Work",
  "CRM",
  "Projects",
  "Parks",
  "Tasks",
  "Team",
  "Learning",
  "Rewards",
  "Resources",
  "Finance",
  "Reports",
  "Settings"
];

const actions = [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "ASSIGN",
  "APPROVE",
  "EXPORT",
  "UPLOAD",
  "DOWNLOAD",
  "SHARE",
  "MANAGE"
];

async function main() {
  console.log("Seeding Custom RBAC Engine...");

  // 1. Seed Permissions
  const permissionIds: string[] = [];
  for (const mod of modules) {
    for (const act of actions) {
      const p = await prisma.permission.upsert({
        where: {
          module_action: {
            module: mod,
            action: act
          }
        },
        update: {},
        create: {
          module: mod,
          action: act,
          description: `Can ${act.toLowerCase()} in ${mod}`
        }
      });
      permissionIds.push(p.id);
    }
  }

  // 2. Seed Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "Full system access",
      isActive: true
    }
  });

  // Assign all permissions to SUPER_ADMIN
  for (const pId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: pId
        }
      },
      update: { effect: "ALLOW", scope: "ALL" },
      create: {
        roleId: superAdminRole.id,
        permissionId: pId,
        effect: "ALLOW",
        scope: "ALL"
      }
    });
  }

  // 3. Ensure Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@minion.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      password: hashedPassword,
      roleId: superAdminRole.id
    },
    create: {
      email: adminEmail,
      name: "Dinesh Admin",
      password: hashedPassword,
      roleId: superAdminRole.id
    }
  });

  const employee = await prisma.employee.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      designation: "CEO",
      department: "Management"
    }
  });

  // Example: Project Coordinator
  const pcRole = await prisma.role.upsert({
    where: { name: "Project Coordinator" },
    update: {},
    create: {
      name: "Project Coordinator",
      description: "Coordinates CRM requirements, projects, tasks and documentation."
    }
  });

  // Example: Assign PC some specific permissions
  const pcPerms = [
    { mod: "CRM", act: "VIEW", scope: "ALL" },
    { mod: "CRM", act: "EDIT", scope: "OWN" },
    { mod: "Projects", act: "VIEW", scope: "ALL" },
    { mod: "Projects", act: "EDIT", scope: "ASSIGNED" },
    { mod: "Tasks", act: "VIEW", scope: "ALL" },
    { mod: "Tasks", act: "CREATE", scope: "ALL" },
    { mod: "Tasks", act: "EDIT", scope: "ALL" },
    { mod: "Tasks", act: "ASSIGN", scope: "ALL" },
    { mod: "Team", act: "VIEW", scope: "ALL" }
  ];

  for (const pcP of pcPerms) {
    const p = await prisma.permission.findUnique({
      where: { module_action: { module: pcP.mod, action: pcP.act } }
    });
    if (p) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: pcRole.id, permissionId: p.id } },
        update: { effect: "ALLOW", scope: pcP.scope },
        create: { roleId: pcRole.id, permissionId: p.id, effect: "ALLOW", scope: pcP.scope }
      });
    }
  }

  console.log("RBAC seeding complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
