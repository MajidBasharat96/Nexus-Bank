import { Request, Response, NextFunction } from 'express';
import { Database } from '../../config/database.config';
import { AppError } from '../../common/middleware/error.middleware';

function generateLoanNumber(): string {
  const date = new Date().toISOString().slice(0,7).replace('-','');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LN${date}${rand}`;
}

function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function generateAmortizationSchedule(principal: number, annualRate: number, months: number, startDate: Date): any[] {
  const emi = calculateEMI(principal, annualRate, months);
  const monthlyRate = annualRate / 100 / 12;
  let balance = principal;
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().slice(0, 10),
      principalAmount: parseFloat(principalPaid.toFixed(2)),
      interestAmount: parseFloat(interest.toFixed(2)),
      totalAmount: parseFloat(emi.toFixed(2)),
      outstandingBalance: parseFloat(balance.toFixed(2)),
      status: 'pending'
    });
  }
  return schedule;
}

export class LoanService {

  async applyForLoan(data: any, userId: string, tenantId: string): Promise<any> {
    const {
      customerId, loanType, principalAmount, interestRate, tenureMonths,
      purpose, collateral, isIslamic = false, productCode
    } = data;

    const customer = await Database.query('SELECT * FROM customers WHERE id = $1 AND tenant_id = $2', [customerId, tenantId]);
    if (customer.rows.length === 0) throw new AppError('Customer not found', 404);

    const emi = calculateEMI(principalAmount, interestRate, tenureMonths);
    const loanNumber = generateLoanNumber();

    const firstPaymentDate = new Date();
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

    const schedule = generateAmortizationSchedule(principalAmount, interestRate, tenureMonths, new Date());

    const result = await Database.query(
      `INSERT INTO loans (tenant_id, loan_number, customer_id, loan_type, product_code, principal_amount,
        outstanding_amount, interest_rate, emi_amount, tenure_months, first_payment_date, maturity_date,
        purpose, collateral, status, is_islamic, originator, amortization_schedule)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,'pending',$14,$15,$16)
       RETURNING *`,
      [tenantId, loanNumber, customerId, loanType, productCode, principalAmount,
       interestRate, emi, tenureMonths, firstPaymentDate.toISOString().slice(0,10),
       maturityDate.toISOString().slice(0,10), purpose, JSON.stringify(collateral || []),
       isIslamic, userId, JSON.stringify(schedule)]
    );

    return { loan: result.rows[0], emi: emi.toFixed(2), schedule };
  }

  async approveLoan(id: string, data: any, userId: string, tenantId: string): Promise<any> {
    const { action, disbursementAccountId, remarks } = data;

    const loanResult = await Database.query(
      'SELECT * FROM loans WHERE id = $1 AND tenant_id = $2', [id, tenantId]
    );
    if (loanResult.rows.length === 0) throw new AppError('Loan not found', 404);
    const loan = loanResult.rows[0];
    if (loan.status !== 'pending') throw new AppError('Loan is not in pending status', 400);

    if (action === 'approve') {
      return Database.transaction(async (client) => {
        await client.query(
          `UPDATE loans SET status = 'approved', approved_by = $1, approved_at = NOW(),
            disbursement_date = CURRENT_DATE, disbursed_amount = principal_amount,
            outstanding_amount = principal_amount, updated_at = NOW()
           WHERE id = $2`,
          [userId, id]
        );

        // Credit loan amount to account if disbursement account provided
        if (disbursementAccountId) {
          await client.query(
            'UPDATE accounts SET balance = balance + $1, available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
            [loan.principal_amount, disbursementAccountId]
          );

          await client.query(
            `INSERT INTO transactions (tenant_id, transaction_reference, transaction_type, credit_account_id,
              amount, currency, description, status, initiated_by, processed_at)
             VALUES ($1, $2, 'loan_disbursement', $3, $4, 'PKR', $5, 'completed', $6, NOW())`,
            [tenantId, `DISB${Date.now()}`, disbursementAccountId, loan.principal_amount,
             `Loan Disbursement - ${loan.loan_number}`, userId]
          );

          await client.query('UPDATE loans SET account_id = $1, disbursed_by = $2, disbursed_at = NOW(), status = $3 WHERE id = $4',
            [disbursementAccountId, userId, 'active', id]
          );
        } else {
          await client.query('UPDATE loans SET status = $1 WHERE id = $2', ['approved', id]);
        }

        const updated = await client.query('SELECT * FROM loans WHERE id = $1', [id]);
        return updated.rows[0];
      });
    } else {
      const result = await Database.query(
        'UPDATE loans SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['rejected', id]
      );
      return result.rows[0];
    }
  }

  async recordRepayment(loanId: string, data: any, userId: string, tenantId: string): Promise<any> {
    const { amount, installmentNumber, accountId } = data;

    return Database.transaction(async (client) => {
      const loanResult = await client.query(
        'SELECT * FROM loans WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [loanId, tenantId]
      );
      if (loanResult.rows.length === 0) throw new AppError('Loan not found', 404);
      const loan = loanResult.rows[0];

      if (loan.status !== 'active') throw new AppError('Loan is not active', 400);

      // Deduct from account
      if (accountId) {
        const acct = await client.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);
        if (acct.rows.length === 0 || parseFloat(acct.rows[0].available_balance) < amount) {
          throw new AppError('Insufficient balance for repayment', 400);
        }
        await client.query('UPDATE accounts SET balance = balance - $1, available_balance = available_balance - $1 WHERE id = $2', [amount, accountId]);
      }

      const newOutstanding = Math.max(0, parseFloat(loan.outstanding_amount) - parseFloat(amount));
      const newStatus = newOutstanding <= 0 ? 'closed' : 'active';

      await client.query(
        'UPDATE loans SET outstanding_amount = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newOutstanding, newStatus, loanId]
      );

      const txnRef = `RPY${Date.now()}`;
      const txn = await client.query(
        `INSERT INTO transactions (tenant_id, transaction_reference, transaction_type, debit_account_id,
          amount, currency, description, status, initiated_by, processed_at)
         VALUES ($1,$2,'loan_repayment',$3,$4,'PKR',$5,'completed',$6,NOW()) RETURNING *`,
        [tenantId, txnRef, accountId, amount, `Loan Repayment - ${loan.loan_number}`, userId]
      );

      await client.query(
        `INSERT INTO loan_repayments (loan_id, installment_number, due_date, total_amount, paid_amount, paid_date, status, transaction_id)
         SELECT id, $1, CURRENT_DATE, $2, $2, CURRENT_DATE, 'paid', $3 FROM loans WHERE id = $4`,
        [installmentNumber, amount, txn.rows[0].id, loanId]
      );

      return { newOutstanding, transaction: txn.rows[0], loanStatus: newStatus };
    });
  }

  async getLoans(tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, customerId, status, loanType } = filters;
    const offset = (page - 1) * limit;
    const conds = ['l.tenant_id = $1'];
    const params: any[] = [tenantId];
    let pc = 1;

    if (customerId) { pc++; conds.push(`l.customer_id = $${pc}`); params.push(customerId); }
    if (status) { pc++; conds.push(`l.status = $${pc}`); params.push(status); }
    if (loanType) { pc++; conds.push(`l.loan_type = $${pc}`); params.push(loanType); }

    const where = conds.join(' AND ');
    const [rows, count] = await Promise.all([
      Database.query(
        `SELECT l.*, c.full_name as customer_name, c.cif_number FROM loans l
         JOIN customers c ON l.customer_id = c.id
         WHERE ${where} ORDER BY l.created_at DESC LIMIT $${pc+1} OFFSET $${pc+2}`,
        [...params, limit, offset]
      ),
      Database.query(`SELECT COUNT(*) as total FROM loans l WHERE ${where}`, params)
    ]);

    return {
      loans: rows.rows,
      pagination: { total: parseInt(count.rows[0].total), page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(parseInt(count.rows[0].total) / limit) }
    };
  }

  async getLoanById(id: string, tenantId: string): Promise<any> {
    const result = await Database.query(
      `SELECT l.*, c.full_name as customer_name, c.cif_number, c.email as customer_email
       FROM loans l JOIN customers c ON l.customer_id = c.id
       WHERE l.id = $1 AND l.tenant_id = $2`,
      [id, tenantId]
    );
    if (result.rows.length === 0) throw new AppError('Loan not found', 404);
    return result.rows[0];
  }

  async getLoanStats(tenantId: string): Promise<any> {
    const result = await Database.query(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(principal_amount), 0) as total_principal,
        COALESCE(SUM(outstanding_amount), 0) as total_outstanding
       FROM loans WHERE tenant_id = $1 GROUP BY status`,
      [tenantId]
    );
    return result.rows;
  }
}

export class LoanController {
  private service = new LoanService();

  apply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.applyForLoan(req.body, (req as any).user.id, (req as any).tenantId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.approveLoan(req.params.id, req.body, (req as any).user.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  repay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.recordRepayment(req.params.id, req.body, (req as any).user.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getLoans((req as any).tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getLoanById(req.params.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getLoanStats((req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };
}
