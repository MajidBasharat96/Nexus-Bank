import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from './app.config';
import { logger } from './logger.config';

let pool: Pool;
let connected = false;

export class Database {
  static async connect(): Promise<void> {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    connected = true;
  }

  static isConnected(): boolean {
    return connected;
  }

  static async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn('Slow query detected', { text, duration, rows: result.rowCount });
    }

    return result;
  }

  static async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async disconnect(): Promise<void> {
    if (pool) {
      await pool.end();
      connected = false;
    }
  }

  static async runMigrations(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

      // Create tenants table first (for multi-tenancy)
      await client.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'standard',
          status VARCHAR(20) DEFAULT 'active',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'customer',
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          mfa_enabled BOOLEAN DEFAULT false,
          mfa_secret VARCHAR(255),
          last_login TIMESTAMP,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          password_changed_at TIMESTAMP DEFAULT NOW(),
          force_password_change BOOLEAN DEFAULT false,
          profile JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Customers (CIF)
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          cif_number VARCHAR(20) UNIQUE NOT NULL,
          customer_type VARCHAR(20) NOT NULL DEFAULT 'individual',
          user_id UUID REFERENCES users(id),
          title VARCHAR(10),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          middle_name VARCHAR(100),
          full_name VARCHAR(255) GENERATED ALWAYS AS (COALESCE(title || ' ', '') || first_name || ' ' || COALESCE(middle_name || ' ', '') || last_name) STORED,
          date_of_birth DATE,
          gender VARCHAR(10),
          nationality VARCHAR(50),
          national_id VARCHAR(50),
          passport_number VARCHAR(50),
          tax_id VARCHAR(50),
          occupation VARCHAR(100),
          employer VARCHAR(255),
          monthly_income DECIMAL(15,2),
          annual_income DECIMAL(15,2),
          risk_category VARCHAR(20) DEFAULT 'low',
          kyc_status VARCHAR(20) DEFAULT 'pending',
          kyc_verified_at TIMESTAMP,
          kyc_documents JSONB DEFAULT '[]',
          email VARCHAR(255),
          phone VARCHAR(20),
          alt_phone VARCHAR(20),
          address JSONB,
          mailing_address JSONB,
          segment VARCHAR(50) DEFAULT 'retail',
          relationship_manager UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'active',
          pep_status BOOLEAN DEFAULT false,
          sanctions_checked BOOLEAN DEFAULT false,
          aml_risk_score DECIMAL(5,2) DEFAULT 0,
          onboarded_at TIMESTAMP DEFAULT NOW(),
          onboarded_by UUID REFERENCES users(id),
          corporate_details JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Accounts
      await client.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          account_number VARCHAR(30) UNIQUE NOT NULL,
          iban VARCHAR(34),
          customer_id UUID REFERENCES customers(id),
          account_type VARCHAR(50) NOT NULL,
          account_subtype VARCHAR(50),
          currency VARCHAR(3) DEFAULT 'PKR',
          balance DECIMAL(20,4) DEFAULT 0,
          available_balance DECIMAL(20,4) DEFAULT 0,
          hold_amount DECIMAL(20,4) DEFAULT 0,
          minimum_balance DECIMAL(15,2) DEFAULT 0,
          overdraft_limit DECIMAL(15,2) DEFAULT 0,
          interest_rate DECIMAL(8,4) DEFAULT 0,
          profit_rate DECIMAL(8,4) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          is_islamic BOOLEAN DEFAULT false,
          is_joint BOOLEAN DEFAULT false,
          joint_holders JSONB DEFAULT '[]',
          linked_accounts JSONB DEFAULT '[]',
          dormant BOOLEAN DEFAULT false,
          dormant_since DATE,
          last_transaction_date TIMESTAMP,
          opened_at TIMESTAMP DEFAULT NOW(),
          closed_at TIMESTAMP,
          branch_id UUID,
          product_code VARCHAR(50),
          features JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Transactions
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          transaction_reference VARCHAR(50) UNIQUE NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          payment_type VARCHAR(50),
          debit_account_id UUID REFERENCES accounts(id),
          credit_account_id UUID REFERENCES accounts(id),
          debit_account_number VARCHAR(30),
          credit_account_number VARCHAR(30),
          amount DECIMAL(20,4) NOT NULL,
          currency VARCHAR(3) DEFAULT 'PKR',
          exchange_rate DECIMAL(15,6) DEFAULT 1,
          base_amount DECIMAL(20,4),
          fee DECIMAL(10,4) DEFAULT 0,
          tax DECIMAL(10,4) DEFAULT 0,
          net_amount DECIMAL(20,4),
          description TEXT,
          narration TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          channel VARCHAR(50),
          initiated_by UUID REFERENCES users(id),
          approved_by UUID REFERENCES users(id),
          batch_id UUID,
          external_reference VARCHAR(100),
          beneficiary_name VARCHAR(255),
          beneficiary_bank VARCHAR(255),
          beneficiary_account VARCHAR(50),
          beneficiary_iban VARCHAR(34),
          fraud_score DECIMAL(5,2) DEFAULT 0,
          risk_flags JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          value_date DATE,
          processed_at TIMESTAMP,
          reversed_at TIMESTAMP,
          reversal_reason TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Loans
      await client.query(`
        CREATE TABLE IF NOT EXISTS loans (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          loan_number VARCHAR(30) UNIQUE NOT NULL,
          customer_id UUID REFERENCES customers(id),
          account_id UUID REFERENCES accounts(id),
          loan_type VARCHAR(50) NOT NULL,
          product_code VARCHAR(50),
          principal_amount DECIMAL(20,4) NOT NULL,
          outstanding_amount DECIMAL(20,4),
          disbursed_amount DECIMAL(20,4),
          interest_rate DECIMAL(8,4) NOT NULL,
          emi_amount DECIMAL(15,4),
          tenure_months INTEGER NOT NULL,
          disbursement_date DATE,
          first_payment_date DATE,
          maturity_date DATE,
          purpose TEXT,
          collateral JSONB DEFAULT '[]',
          credit_score INTEGER,
          ltv_ratio DECIMAL(5,2),
          status VARCHAR(30) DEFAULT 'pending',
          is_islamic BOOLEAN DEFAULT false,
          restructured BOOLEAN DEFAULT false,
          written_off BOOLEAN DEFAULT false,
          npa_date DATE,
          npd_date DATE,
          days_past_due INTEGER DEFAULT 0,
          originator UUID REFERENCES users(id),
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP,
          disbursed_by UUID REFERENCES users(id),
          disbursed_at TIMESTAMP,
          amortization_schedule JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Cards
      await client.query(`
        CREATE TABLE IF NOT EXISTS cards (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          card_number_masked VARCHAR(19) NOT NULL,
          card_number_encrypted TEXT NOT NULL,
          card_token VARCHAR(255) UNIQUE,
          customer_id UUID REFERENCES customers(id),
          account_id UUID REFERENCES accounts(id),
          card_type VARCHAR(20) NOT NULL,
          card_scheme VARCHAR(20),
          card_holder_name VARCHAR(255) NOT NULL,
          expiry_month INTEGER,
          expiry_year INTEGER,
          cvv_encrypted TEXT,
          status VARCHAR(20) DEFAULT 'inactive',
          is_virtual BOOLEAN DEFAULT false,
          daily_limit DECIMAL(15,2) DEFAULT 50000,
          single_transaction_limit DECIMAL(15,2) DEFAULT 25000,
          online_transactions_enabled BOOLEAN DEFAULT true,
          international_transactions_enabled BOOLEAN DEFAULT false,
          contactless_enabled BOOLEAN DEFAULT true,
          issued_at TIMESTAMP DEFAULT NOW(),
          activated_at TIMESTAMP,
          blocked_at TIMESTAMP,
          block_reason TEXT,
          expiry_date DATE,
          apple_pay_token TEXT,
          google_pay_token TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Audit logs
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50),
          user_id UUID,
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50),
          resource_id VARCHAR(100),
          old_values JSONB,
          new_values JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          request_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'success',
          error_message TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // AML/Compliance alerts
      await client.query(`
        CREATE TABLE IF NOT EXISTS compliance_alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50),
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) DEFAULT 'medium',
          customer_id UUID REFERENCES customers(id),
          account_id UUID REFERENCES accounts(id),
          transaction_id UUID REFERENCES transactions(id),
          description TEXT,
          risk_score DECIMAL(5,2),
          status VARCHAR(20) DEFAULT 'open',
          assigned_to UUID REFERENCES users(id),
          resolved_at TIMESTAMP,
          resolved_by UUID REFERENCES users(id),
          resolution_notes TEXT,
          regulatory_report_filed BOOLEAN DEFAULT false,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Notifications
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50),
          user_id UUID REFERENCES users(id),
          customer_id UUID REFERENCES customers(id),
          type VARCHAR(50) NOT NULL,
          channel VARCHAR(20) NOT NULL,
          title VARCHAR(255),
          message TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'pending',
          sent_at TIMESTAMP,
          read_at TIMESTAMP,
          failed_reason TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Branches
      await client.query(`
        CREATE TABLE IF NOT EXISTS branches (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          branch_code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(30) DEFAULT 'branch',
          address JSONB,
          phone VARCHAR(20),
          email VARCHAR(255),
          manager_id UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'active',
          operating_hours JSONB DEFAULT '{}',
          services JSONB DEFAULT '[]',
          atm_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Products
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50) REFERENCES tenants(tenant_id),
          product_code VARCHAR(50) UNIQUE NOT NULL,
          product_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          features JSONB DEFAULT '{}',
          fees JSONB DEFAULT '{}',
          interest_rate DECIMAL(8,4),
          min_amount DECIMAL(15,2),
          max_amount DECIMAL(15,2),
          tenure_min INTEGER,
          tenure_max INTEGER,
          eligibility_criteria JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          is_islamic BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Loan repayments
      await client.query(`
        CREATE TABLE IF NOT EXISTS loan_repayments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          loan_id UUID REFERENCES loans(id),
          installment_number INTEGER,
          due_date DATE NOT NULL,
          principal_amount DECIMAL(15,4),
          interest_amount DECIMAL(15,4),
          total_amount DECIMAL(15,4),
          paid_amount DECIMAL(15,4) DEFAULT 0,
          paid_date DATE,
          status VARCHAR(20) DEFAULT 'pending',
          penalty DECIMAL(10,4) DEFAULT 0,
          transaction_id UUID REFERENCES transactions(id),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Fraud alerts
      await client.query(`
        CREATE TABLE IF NOT EXISTS fraud_alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(50),
          transaction_id UUID REFERENCES transactions(id),
          customer_id UUID REFERENCES customers(id),
          alert_type VARCHAR(50),
          fraud_score DECIMAL(5,2),
          indicators JSONB DEFAULT '[]',
          status VARCHAR(20) DEFAULT 'open',
          action_taken VARCHAR(50),
          reviewed_by UUID REFERENCES users(id),
          reviewed_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(debit_account_id, credit_account_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_customers_cif ON customers(cif_number)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_customer ON accounts(customer_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_alerts(status)');

      // Insert default tenant
      await client.query(`
        INSERT INTO tenants (tenant_id, name, domain, plan, status)
        VALUES ('default', 'NexusBank Default', 'nexusbank.com', 'enterprise', 'active')
        ON CONFLICT (tenant_id) DO NOTHING
      `);

      // Insert default admin user
      const bcrypt = require('bcryptjs');
      const adminPasswordHash = await bcrypt.hash('Admin@NexusBank123', 12);
      await client.query(`
        INSERT INTO users (tenant_id, username, email, password_hash, role, is_active, is_verified)
        VALUES ('default', 'admin', 'admin@nexusbank.com', $1, 'super_admin', true, true)
        ON CONFLICT (username) DO NOTHING
      `, [adminPasswordHash]);

      // Insert sample branches
      await client.query(`
        INSERT INTO branches (tenant_id, branch_code, name, type, address, phone, email, status)
        VALUES 
          ('default', 'HQ001', 'Head Office', 'headquarters', '{"city": "Karachi", "country": "Pakistan"}', '+92-21-111-639-275', 'hq@nexusbank.com', 'active'),
          ('default', 'KHI001', 'Karachi Main Branch', 'branch', '{"city": "Karachi", "country": "Pakistan"}', '+92-21-111-639-276', 'karachi@nexusbank.com', 'active'),
          ('default', 'LHE001', 'Lahore Main Branch', 'branch', '{"city": "Lahore", "country": "Pakistan"}', '+92-42-111-639-277', 'lahore@nexusbank.com', 'active')
        ON CONFLICT (branch_code) DO NOTHING
      `);

      await client.query('COMMIT');
      logger.info('✅ Database migrations completed successfully');

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export { pool };
