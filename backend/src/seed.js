// src/seed.js - Populate database with demo data
const bcrypt = require('bcrypt');
const db = require('./db');
const { randomUUID } = require('crypto');

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM financial_records; DELETE FROM users;');

  // Create users
  const users = [
    { email: 'admin@finance.com',   password: 'admin123',   name: 'Admin User',   role: 'ADMIN' },
    { email: 'analyst@finance.com', password: 'analyst123', name: 'Analyst User', role: 'ANALYST' },
    { email: 'viewer@finance.com',  password: 'viewer123',  name: 'Viewer User',  role: 'VIEWER' },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    insertUser.run(randomUUID(), u.email, hashed, u.name, u.role);
    console.log(`  ✅ Created ${u.role}: ${u.email}`);
  }

  // Create financial records
  const records = [
    { amount: 50000, type: 'INCOME',  category: 'Salary',      date: '2026-03-01', notes: 'Monthly payroll' },
    { amount: 12000, type: 'EXPENSE', category: 'Rent',         date: '2026-03-03', notes: 'Office rent Q1' },
    { amount: 3500,  type: 'EXPENSE', category: 'Utilities',    date: '2026-03-08', notes: 'Electricity & internet' },
    { amount: 8000,  type: 'INCOME',  category: 'Freelance',    date: '2026-03-12', notes: 'Project payment - ClientA' },
    { amount: 1500,  type: 'EXPENSE', category: 'Food',         date: '2026-03-15', notes: 'Team lunch' },
    { amount: 25000, type: 'INCOME',  category: 'Investment',   date: '2026-03-20', notes: 'Stock dividends' },
    { amount: 4000,  type: 'EXPENSE', category: 'Travel',       date: '2026-03-22', notes: 'Flight to conference' },
    { amount: 900,   type: 'EXPENSE', category: 'Subscriptions',date: '2026-03-28', notes: 'SaaS tools' },
    { amount: 50000, type: 'INCOME',  category: 'Salary',       date: '2026-04-01', notes: 'Monthly payroll April' },
    { amount: 12000, type: 'EXPENSE', category: 'Rent',         date: '2026-04-03', notes: 'Office rent April' },
    { amount: 6000,  type: 'INCOME',  category: 'Freelance',    date: '2026-04-05', notes: 'Project payment - ClientB' },
  ];

  const insertRecord = db.prepare(`
    INSERT INTO financial_records (id, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const r of records) {
    insertRecord.run(randomUUID(), r.amount, r.type, r.category, r.date, r.notes);
  }
  console.log(`  ✅ Created ${records.length} financial records`);
  console.log('\n🎉 Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@finance.com   / admin123');
  console.log('  Analyst: analyst@finance.com / analyst123');
  console.log('  Viewer:  viewer@finance.com  / viewer123\n');
}

seed().catch(console.error);
