import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../config/database.config';
import { AppError } from '../../common/middleware/error.middleware';
import { logger } from '../../config/logger.config';

function generateCifNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `CIF${timestamp}${random}`;
}

export class CustomerService {

  async createCustomer(data: any, userId: string, tenantId: string): Promise<any> {
    return Database.transaction(async (client) => {
      const cifNumber = generateCifNumber();

      const result = await client.query(
        `INSERT INTO customers (
          tenant_id, cif_number, customer_type, title, first_name, last_name, middle_name,
          date_of_birth, gender, nationality, national_id, passport_number, tax_id,
          occupation, employer, monthly_income, annual_income,
          email, phone, alt_phone, address, mailing_address,
          segment, risk_category, kyc_status, status, onboarded_by,
          corporate_details, pep_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
        RETURNING *`,
        [
          tenantId, cifNumber, data.customerType || 'individual',
          data.title, data.firstName, data.lastName, data.middleName,
          data.dateOfBirth, data.gender, data.nationality || 'Pakistani',
          data.nationalId, data.passportNumber, data.taxId,
          data.occupation, data.employer, data.monthlyIncome, data.annualIncome,
          data.email, data.phone, data.altPhone,
          JSON.stringify(data.address || {}),
          JSON.stringify(data.mailingAddress || {}),
          data.segment || 'retail', data.riskCategory || 'low',
          'pending', 'active', userId,
          JSON.stringify(data.corporateDetails || {}),
          data.pepStatus || false
        ]
      );

      return result.rows[0];
    });
  }

  async getCustomers(tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, search, status, segment, kycStatus } = filters;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['c.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      conditions.push(`(c.full_name ILIKE $${paramCount} OR c.cif_number ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount} OR c.national_id ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      conditions.push(`c.status = $${paramCount}`);
      params.push(status);
    }

    if (segment) {
      paramCount++;
      conditions.push(`c.segment = $${paramCount}`);
      params.push(segment);
    }

    if (kycStatus) {
      paramCount++;
      conditions.push(`c.kyc_status = $${paramCount}`);
      params.push(kycStatus);
    }

    const whereClause = conditions.join(' AND ');

    const [customersResult, countResult] = await Promise.all([
      Database.query(
        `SELECT c.*, 
          COUNT(a.id) as account_count,
          COALESCE(SUM(a.balance), 0) as total_balance
         FROM customers c
         LEFT JOIN accounts a ON a.customer_id = c.id AND a.status = 'active'
         WHERE ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      ),
      Database.query(
        `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`,
        params
      )
    ]);

    return {
      customers: customersResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    };
  }

  async getCustomerById(id: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      `SELECT c.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', a.id,
          'accountNumber', a.account_number,
          'accountType', a.account_type,
          'balance', a.balance,
          'currency', a.currency,
          'status', a.status
        )) FILTER (WHERE a.id IS NOT NULL) as accounts
       FROM customers c
       LEFT JOIN accounts a ON a.customer_id = c.id
       WHERE (c.id = $1 OR c.cif_number = $1) AND c.tenant_id = $2
       GROUP BY c.id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) throw new AppError('Customer not found', 404);
    return result.rows[0];
  }

  async updateCustomer(id: string, data: any, tenantId: string): Promise<any> {
    const customer = await this.getCustomerById(id, tenantId);

    const result = await Database.query(
      `UPDATE customers SET
        title = COALESCE($1, title),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        occupation = COALESCE($6, occupation),
        employer = COALESCE($7, employer),
        monthly_income = COALESCE($8, monthly_income),
        address = COALESCE($9, address),
        risk_category = COALESCE($10, risk_category),
        segment = COALESCE($11, segment),
        updated_at = NOW()
       WHERE id = $12 AND tenant_id = $13
       RETURNING *`,
      [
        data.title, data.firstName, data.lastName,
        data.email, data.phone, data.occupation, data.employer,
        data.monthlyIncome,
        data.address ? JSON.stringify(data.address) : null,
        data.riskCategory, data.segment,
        customer.id, tenantId
      ]
    );

    return result.rows[0];
  }

  async updateKycStatus(id: string, status: string, documents: any[], tenantId: string, userId: string): Promise<any> {
    const result = await Database.query(
      `UPDATE customers SET
        kyc_status = $1,
        kyc_documents = $2,
        kyc_verified_at = CASE WHEN $1 = 'verified' THEN NOW() ELSE kyc_verified_at END,
        updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [status, JSON.stringify(documents), id, tenantId]
    );

    if (result.rows.length === 0) throw new AppError('Customer not found', 404);
    return result.rows[0];
  }

  async getCustomerTransactions(customerId: string, tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    const params: any[] = [customerId, tenantId];
    let paramCount = 2;
    let dateFilter = '';

    if (startDate) {
      paramCount++;
      dateFilter += ` AND t.created_at >= $${paramCount}`;
      params.push(startDate);
    }
    if (endDate) {
      paramCount++;
      dateFilter += ` AND t.created_at <= $${paramCount}`;
      params.push(endDate);
    }

    const result = await Database.query(
      `SELECT t.* FROM transactions t
       JOIN accounts a ON (t.debit_account_id = a.id OR t.credit_account_id = a.id)
       WHERE a.customer_id = $1 AND a.tenant_id = $2 ${dateFilter}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return result.rows;
  }

  async getCustomerStatement(customerId: string, accountId: string, startDate: string, endDate: string, tenantId: string): Promise<any> {
    const account = await Database.query(
      'SELECT * FROM accounts WHERE id = $1 AND customer_id = $2 AND tenant_id = $3',
      [accountId, customerId, tenantId]
    );

    if (account.rows.length === 0) throw new AppError('Account not found', 404);

    const transactions = await Database.query(
      `SELECT * FROM transactions
       WHERE (debit_account_id = $1 OR credit_account_id = $1)
       AND created_at BETWEEN $2 AND $3
       ORDER BY created_at ASC`,
      [accountId, startDate, endDate]
    );

    return {
      account: account.rows[0],
      transactions: transactions.rows,
      period: { startDate, endDate }
    };
  }

  async searchCustomers(query: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      `SELECT id, cif_number, full_name, email, phone, national_id, status, kyc_status
       FROM customers
       WHERE tenant_id = $1 AND (
         full_name ILIKE $2 OR
         cif_number ILIKE $2 OR
         email ILIKE $2 OR
         phone ILIKE $2 OR
         national_id ILIKE $2
       )
       LIMIT 10`,
      [tenantId, `%${query}%`]
    );

    return result.rows;
  }
}

export class CustomerController {
  private service = new CustomerService();

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;
      const customer = await this.service.createCustomer(req.body, userId, tenantId);
      res.status(201).json({ success: true, data: customer });
    } catch (error) { next(error); }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const result = await this.service.getCustomers(tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const customer = await this.service.getCustomerById(req.params.id, tenantId);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const customer = await this.service.updateCustomer(req.params.id, req.body, tenantId);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  };

  updateKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).user.id;
      const { status, documents } = req.body;
      const customer = await this.service.updateKycStatus(req.params.id, status, documents || [], tenantId, userId);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const txns = await this.service.getCustomerTransactions(req.params.id, tenantId, req.query);
      res.json({ success: true, data: txns });
    } catch (error) { next(error); }
  };

  getStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const { accountId, startDate, endDate } = req.query as any;
      const statement = await this.service.getCustomerStatement(req.params.id, accountId, startDate, endDate, tenantId);
      res.json({ success: true, data: statement });
    } catch (error) { next(error); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = (req as any).tenantId;
      const { q } = req.query as any;
      const results = await this.service.searchCustomers(q, tenantId);
      res.json({ success: true, data: results });
    } catch (error) { next(error); }
  };
}
