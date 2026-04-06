import prisma from './prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const analystPassword = await bcrypt.hash('analyst123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.com' },
    update: {},
    create: {
      email: 'admin@finance.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance.com' },
    update: {},
    create: {
      email: 'analyst@finance.com',
      name: 'Analyst User',
      password: analystPassword,
      role: 'ANALYST',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finance.com' },
    update: {},
    create: {
      email: 'viewer@finance.com',
      name: 'Viewer User',
      password: viewerPassword,
      role: 'VIEWER',
    },
  });

  // Create some financial records
  await prisma.financialRecord.createMany({
    data: [
      { amount: 5000, type: 'INCOME', category: 'Salary', notes: 'Monthly payroll', date: new Date('2026-03-01') },
      { amount: 1500, type: 'EXPENSE', category: 'Rent', notes: 'Office space', date: new Date('2026-03-05') },
      { amount: 200, type: 'EXPENSE', category: 'Food', notes: 'Team lunch', date: new Date('2026-03-10') },
      { amount: 1000, type: 'INCOME', category: 'Freelance', notes: 'Project payment', date: new Date('2026-03-15') },
      { amount: 300, type: 'EXPENSE', category: 'Utilities', notes: 'Electricity bill', date: new Date('2026-03-20') },
      { amount: 50, type: 'EXPENSE', category: 'Travel', notes: 'Taxi', date: new Date('2026-03-25') },
      { amount: 2500, type: 'INCOME', category: 'Investment', notes: 'Stock dividends', date: new Date('2026-04-01') },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
