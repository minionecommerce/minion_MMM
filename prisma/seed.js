const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      permissions: JSON.stringify(['all']),
    },
  });

  // Create standard Employee Role
  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      permissions: JSON.stringify(['read_own', 'write_own']),
    },
  });

  // Create an Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@minion.com' },
    update: {},
    create: {
      email: 'admin@minion.com',
      name: 'Dinesh Admin',
      password: hashedPassword,
      roleId: superAdminRole.id,
      employee: {
        create: {
          designation: 'CEO',
          department: 'Management',
          contactNumber: '+91 9876543210',
          joiningDate: new Date(),
        }
      }
    },
  });

  console.log({ superAdminRole, adminUser });
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
