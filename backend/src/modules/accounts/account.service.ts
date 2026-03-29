import { Request, Response, NextFunction } from 'express';
import { Database } from '../../config/database.config';
import { AppError } from '../../common/middleware/error.middleware';

function generateAccountNumber(): string {
  const prefix = '1234';
  const rand = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
  return `${prefix}${rand}`;
}

function generateIBAN(accountNumber: string): string {
  return `PK${Math.floor(10 + Math.random() * 89)}NXBK${accountNumber}`;
}

export class AccountService {

  async createAccount(data: any, userId: string, tenantId: string): Promise<any> {
    const { customerId, accountType, currency = 'PKR', overdraftLimit = 0, isIslamic = false, branchId, productCode } = data;

    const customer = await Database.query('SELECT id FROM customers WHERE id = $1 AND tenant_id = $2', [customerId, tenantId]);
    if (customer.rows.length === 0) throw new AppError('Customer not found', 404);

    const accountNumber = generateAccountNumber();
    const iban = generateIBAN(accountNumber);

    const minBalance: Record<string, number> = {
      savings: 1000, current: 5000, fixed_deposit: 10000, forex: 5000, default: 0
    };

    const result = await Database.query(
      `INSERT INTO accounts (tenant_id, account_number, iban, customer_id, account_type, currency,
        balance, available_balance, minimum_balance, overdraft_limit, status, is_islamic, branch_id, product_code)
       VALUES ($1,$2,$3,$4,$5,$6,0,0,$7,$8,'active',$9,$10,$11)
       RETURNING *`,
      [tenantId, accountNumber, iban, customerId, accountType, currency,
       minBalance[accountType] || minBalance.default, overdraftLimit, isIslamic, branchId, productCode]
    );

    return result.rows[0];
  }

  async getAccounts(tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, customerId, accountType, status, search } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['a.tenant_id = $1'];
    const params: any[] = [tenantId];
    let pc = 1;

    if (customerId) { pc++; conditions.push(`a.customer_id = $${pc}`); params.push(customerId); }
    if (accountType) { pc++; conditions.push(`a.account_type = $${pc}`); params.push(accountType); }
    if (status) { pc++; conditions.push(`a.status = $${pc}`); params.push(status); }
    if (search) { pc++; conditions.push(`(a.account_number ILIKE $${pc} OR c.full_name ILIKE $${pc})`); params.push(`%${search}%`); }

    const where = conditions.join(' AND ');
    const [rows, count] = await Promise.all([
      Database.query(
        `SELECT a.*, c.full_name as customer_name, c.cif_number
         FROM accounts a JOIN customers c ON a.customer_id = c.id
         WHERE ${where} ORDER BY a.created_at DESC LIMIT $${pc+1} OFFSET $${pc+2}`,
        [...params, limit, offset]
      ),
      Database.query(`SELECT COUNT(*) as total FROM accounts a JOIN customers c ON a.customer_id = c.id WHERE ${where}`, params)
    ]);

    return {
      accounts: rows.rows,
      pagination: { total: parseInt(count.rows[0].total), page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(parseInt(count.rows[0].total) / limit) }
    };
  }

  async getAccountById(id: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      `SELECT a.*, c.full_name as customer_name, c.cif_number, c.email as customer_email, c.phone as customer_phone
       FROM accounts a JOIN customers c ON a.customer_id = c.id
       WHERE (a.id = $1 OR a.account_number = $1) AND a.tenant_id = $2`,
      [id, tenantId]
    );
    if (result.rows.length === 0) throw new AppError('Account not found', 404);
    return result.rows[0];
  }

  async updateAccountStatus(id: string, status: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      `UPDATE accounts SET status = $1, updated_at = NOW(),
        closed_at = CASE WHEN $1 = 'closed' THEN NOW() ELSE closed_at END
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );
    if (result.rows.length === 0) throw new AppError('Account not found', 404);
    return result.rows[0];
  }

  async getAccountBalance(id: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      'SELECT account_number, balance, available_balance, hold_amount, currency, status FROM accounts WHERE (id = $1 OR account_number = $1) AND tenant_id = $2',
      [id, tenantId]
    );
    if (result.rows.length === 0) throw new AppError('Account not found', 404);
    return result.rows[0];
  }

  async getDashboardSummary(tenantId: string): Promise<any> {
    const [typeStats, totalStats] = await Promise.all([
      Database.query(
        `SELECT account_type, COUNT(*) as count, COALESCE(SUM(balance), 0) as total_balance, currency
         FROM accounts WHERE tenant_id = $1 AND status = 'active' GROUP BY account_type, currency`,
        [tenantId]
      ),
      Database.query(
        `SELECT COUNT(*) as total_accounts, COALESCE(SUM(balance), 0) as total_balance,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN dormant = true THEN 1 END) as dormant
         FROM accounts WHERE tenant_id = $1`,
        [tenantId]
      )
    ]);

    return { byType: typeStats.rows, summary: totalStats.rows[0] };
  }
}

export class AccountController {
  private service = new AccountService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createAccount(req.body, (req as any).user.id, (req as any).tenantId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAccounts((req as any).tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAccountById(req.params.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const result = await this.service.updateAccountStatus(req.params.id, status, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAccountBalance(req.params.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getDashboardSummary((req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };
}
