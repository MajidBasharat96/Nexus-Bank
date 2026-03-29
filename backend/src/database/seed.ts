/**
 * NexusBank - Demo Data Seeder
 * Run: ts-node src/database/seed.ts
 * 
 * Creates sample customers, accounts, and transactions for demonstration
 */
import { Database } from '../config/database.config';
import { config } from '../config/app.config';
import { logger } from '../config/logger.config';

async function seed() {
  await Database.connect();
  logger.info('🌱 Starting database seed...');

  const client = await Database.getClient();
  try {
    await client.query('BEGIN');

    // Sample customers
    const customers = [
      { firstName: 'Ahmed', lastName: 'Khan', email: 'ahmed.khan@email.com', phone: '+92-300-1234567', nationalId: '42201-1234567-1', occupation: 'Engineer', monthlyIncome: 150000 },
      { firstName: 'Fatima', lastName: 'Ali', email: 'fatima.ali@email.com', phone: '+92-301-2345678', nationalId: '42201-2345678-2', occupation: 'Doctor', monthlyIncome: 300000 },
      { firstName: 'Muhammad', lastName: 'Hassan', email: 'm.hassan@email.com', phone: '+92-302-3456789', nationalId: '42201-3456789-3', occupation: 'Business Owner', monthlyIncome: 500000 },
      { firstName: 'Ayesha', lastName: 'Malik', email: 'ayesha.m@email.com', phone: '+92-303-4567890', nationalId: '42201-4567890-4', occupation: 'Teacher', monthlyIncome: 80000 },
      { firstName: 'Usman', lastName: 'Sheikh', email: 'usman.s@email.com', phone: '+92-304-5678901', nationalId: '42201-5678901-5', occupation: 'Accountant', monthlyIncome: 120000 },
    ];

    const customerIds: string[] = [];
    for (const c of customers) {
      const cifNum = `CIF${Date.now()}${Math.floor(Math.random()*9999)}`;
      const res = await client.query(
        `INSERT INTO customers (tenant_id, cif_number, customer_type, first_name, last_name, email, phone, national_id, occupation, monthly_income, kyc_status, status, segment)
         VALUES ('default',$1,'individual',$2,$3,$4,$5,$6,$7,$8,'verified','active','retail')
         ON CONFLICT DO NOTHING RETURNING id`,
        [cifNum, c.firstName, c.lastName, c.email, c.phone, c.nationalId, c.occupation, c.monthlyIncome]
      );
      if (res.rows.length > 0) customerIds.push(res.rows[0].id);
    }

    // Create accounts for each customer
    const accountIds: string[] = [];
    for (const custId of customerIds) {
      const accNum = `1234${Math.floor(100000000 + Math.random()*900000000)}`;
      const initialBalance = Math.floor(50000 + Math.random() * 500000);
      const res = await client.query(
        `INSERT INTO accounts (tenant_id, account_number, iban, customer_id, account_type, currency, balance, available_balance, minimum_balance, status)
         VALUES ('default',$1,$2,$3,'savings','PKR',$4,$4,1000,'active') RETURNING id`,
        [accNum, `PK36NXBK${accNum}`, custId, initialBalance]
      );
      if (res.rows.length > 0) accountIds.push(res.rows[0].id);
    }

    // Create sample transactions
    const txTypes = ['deposit', 'withdrawal', 'transfer'];
    for (let i = 0; i < 50; i++) {
      const acctId = accountIds[Math.floor(Math.random() * accountIds.length)];
      const type = txTypes[Math.floor(Math.random() * txTypes.length)];
      const amount = Math.floor(1000 + Math.random() * 100000);
      const ref = `TXN${Date.now()}${i}`;
      await client.query(
        `INSERT INTO transactions (tenant_id, transaction_reference, transaction_type, ${type === 'deposit' ? 'credit_account_id' : 'debit_account_id'}, amount, currency, description, status, channel, processed_at)
         VALUES ('default',$1,$2,$3,$4,'PKR',$5,'completed','branch',NOW() - INTERVAL '${Math.floor(Math.random()*30)} days')`,
        [ref, type, acctId, amount, `Sample ${type} transaction #${i+1}`]
      );
    }

    await client.query('COMMIT');
    logger.info(`✅ Seeded ${customerIds.length} customers, ${accountIds.length} accounts, 50 transactions`);
    logger.info('🎉 Database seeding complete!');

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await Database.disconnect();
  }
}

seed().catch(console.error);
