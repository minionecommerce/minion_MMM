const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Create Departments
  const managementDept = await prisma.department.upsert({
    where: { name: 'Management' },
    update: {},
    create: { name: 'Management' }
  });
  
  const salesDept = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: { name: 'Sales' }
  });
  
  const techDept = await prisma.department.upsert({
    where: { name: 'Technology' },
    update: {},
    create: { name: 'Technology' }
  });
  
  // 2. Create Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      permissions: JSON.stringify(['all']),
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      permissions: JSON.stringify(['read_own', 'write_own']),
    },
  });

  // 3. Create Admin User
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
          departmentId: managementDept.id,
          department: 'Management',
          contactNumber: '+91 9876543210',
          joiningDate: new Date(),
        }
      }
    },
  });
  
  // 4. Create Employee User
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@minion.com' },
    update: {},
    create: {
      email: 'dev@minion.com',
      name: 'Developer Staff',
      password: hashedPassword,
      roleId: employeeRole.id,
      employee: {
        create: {
          designation: 'Engineer',
          departmentId: techDept.id,
          department: 'Technology',
          contactNumber: '+91 9998887776',
          joiningDate: new Date(),
        }
      }
    },
  });
  
  // 5. Create Customer & Lead
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-1' },
    update: {},
    create: {
      id: 'cust-1',
      name: 'Mr. Ramesh',
      email: 'ramesh@example.com',
      phone: '+91 9999999999',
      address: 'Anna Nagar, Chennai'
    }
  });

  const lead1 = await prisma.lead.upsert({
    where: { id: 'lead-1' },
    update: {},
    create: {
      id: 'lead-1',
      customerId: customer1.id,
      propertyType: 'Villa',
      budgetRange: '50L - 1Cr',
      status: 'Won'
    }
  });

  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal-1' },
    update: {},
    create: {
      id: 'deal-1',
      leadId: lead1.id,
      customerId: customer1.id,
      title: 'Smart Automation for Villa',
      value: 750000.00,
      status: 'Won'
    }
  });

  // 6. Create Project
  const employeeAdmin = await prisma.employee.findUnique({ where: { userId: adminUser.id } });
  
  const project1 = await prisma.project.upsert({
    where: { leadId: lead1.id },
    update: {},
    create: {
      name: 'Mr. Ramesh Residence Automation',
      customerId: customer1.id,
      leadId: lead1.id,
      dealId: deal1.id,
      managerId: employeeAdmin.id,
      type: 'Automation',
      status: 'In Progress',
      progress: 35,
      value: 750000.00
    }
  });
  
  // 7. Create Task
  await prisma.task.create({
    data: {
      title: 'Site measurement - Anna Nagar',
      description: 'Need to take complete layout measurements.',
      projectId: project1.id,
      assigneeId: employeeAdmin.id,
      priority: 'High',
      status: 'Not Started',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1))
    }
  });
  
  await prisma.task.create({
    data: {
      title: 'Prepare BOQ for automation',
      description: 'Lighting and security items list.',
      projectId: project1.id,
      assigneeId: employeeAdmin.id,
      priority: 'Medium',
      status: 'Not Started',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 2))
    }
  });

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
