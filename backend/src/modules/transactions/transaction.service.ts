import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../config/database.config';
import { RedisClient } from '../../config/redis.config';
import { AppError } from '../../common/middleware/error.middleware';
import { config } from '../../config/app.config';
import { logger } from '../../config/logger.config';

function generateReference(): string {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TXN${date}${rand}`;
}

export class TransactionService {

  async deposit(data: any, userId: string, tenantId: string): Promise<any> {
    const { accountId, amount, description, channel = 'branch' } = data;

    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);
    if (amount > config.banking.singleTransactionLimit) {
      throw new AppError(`Amount exceeds single transaction limit of ${config.banking.singleTransactionLimit}`, 400);
    }

    return Database.transaction(async (client) => {
      const acctResult = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND tenant_id = $2 AND status = $3 FOR UPDATE',
        [accountId, tenantId, 'active']
      );
      if (acctResult.rows.length === 0) throw new AppError('Account not found or inactive', 404);

      const account = acctResult.rows[0];
      const newBalance = parseFloat(account.balance) + parseFloat(amount);

      await client.query(
        'UPDATE accounts SET balance = $1, available_balance = $1, last_transaction_date = NOW(), updated_at = NOW() WHERE id = $2',
        [newBalance, accountId]
      );

      const txnRef = generateReference();
      const txnResult = await client.query(
        `INSERT INTO transactions (tenant_id, transaction_reference, transaction_type, credit_account_id,
          credit_account_number, amount, currency, fee, net_amount, description, status, channel,
          initiated_by, processed_at, value_date)
         VALUES ($1,$2,'deposit',$3,$4,$5,$6,0,$5,$7,'completed',$8,$9,NOW(),CURRENT_DATE)
         RETURNING *`,
        [tenantId, txnRef, accountId, account.account_number, amount,
         account.currency, description || 'Cash Deposit', channel, userId]
      );

      return { transaction: txnResult.rows[0], newBalance };
    });
  }

  async withdraw(data: any, userId: string, tenantId: string): Promise<any> {
    const { accountId, amount, description, channel = 'branch' } = data;

    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);

    return Database.transaction(async (client) => {
      const acctResult = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND tenant_id = $2 AND status = $3 FOR UPDATE',
        [accountId, tenantId, 'active']
      );
      if (acctResult.rows.length === 0) throw new AppError('Account not found or inactive', 404);

      const account = acctResult.rows[0];
      if (parseFloat(account.available_balance) < amount) {
        throw new AppError('Insufficient balance', 400);
      }

      const minBalance = parseFloat(account.minimum_balance);
      if (parseFloat(account.balance) - amount < minBalance) {
        throw new AppError(`Withdrawal would breach minimum balance requirement of ${minBalance}`, 400);
      }

      const newBalance = parseFloat(account.balance) - parseFloat(amount);
      await client.query(
        'UPDATE accounts SET balance = $1, available_balance = $1, last_transaction_date = NOW(), updated_at = NOW() WHERE id = $2',
        [newBalance, accountId]
      );

      const txnRef = generateReference();
      const txnResult = await client.query(
        `INSERT INTO transactions (tenant_id, transaction_reference, transaction_type, debit_account_id,
          debit_account_number, amount, currency, fee, net_amount, description, status, channel,
          initiated_by, processed_at, value_date)
         VALUES ($1,$2,'withdrawal',$3,$4,$5,$6,0,$5,$7,'completed',$8,$9,NOW(),CURRENT_DATE)
         RETURNING *`,
        [tenantId, txnRef, accountId, account.account_number, amount,
         account.currency, description || 'Cash Withdrawal', channel, userId]
      );

      return { transaction: txnResult.rows[0], newBalance };
    });
  }

  async transfer(data: any, userId: string, tenantId: string): Promise<any> {
    const {
      fromAccountId, toAccountId, toAccountNumber, amount, description,
      paymentType = 'internal', beneficiaryName, beneficiaryBank
    } = data;

    if (amount <= 0) throw new AppError('Amount must be greater than 0', 400);

    // Check daily limit
    const dailyTotal = await this.getDailyTransferTotal(fromAccountId);
    if (dailyTotal + parseFloat(amount) > config.banking.dailyTransferLimit) {
      throw new AppError('Daily transfer limit exceeded', 400);
    }

    return Database.transaction(async (client) => {
      const fromResult = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND tenant_id = $2 AND status = $3 FOR UPDATE',
        [fromAccountId, tenantId, 'active']
      );
      if (fromResult.rows.length === 0) throw new AppError('Source account not found', 404);

      const fromAccount = fromResult.rows[0];
      if (parseFloat(fromAccount.available_balance) < amount) {
        throw new AppError('Insufficient balance', 400);
      }

      // Calculate fee
      const fee = paymentType === 'ibft' ? config.banking.ibftFee : 0;
      const totalDebit = parseFloat(amount) + fee;

      if (parseFloat(fromAccount.available_balance) < totalDebit) {
        throw new AppError(`Insufficient balance (including fee of ${fee})`, 400);
      }

      let toAccount = null;
      if (toAccountId) {
        const toResult = await client.query(
          'SELECT * FROM accounts WHERE id = $1 AND status = $2 FOR UPDATE',
          [toAccountId, 'active']
        );
        if (toResult.rows.length === 0) throw new AppError('Destination account not found', 404);
        toAccount = toResult.rows[0];
      } else if (toAccountNumber) {
        const toResult = await client.query(
          "SELECT * FROM accounts WHERE account_number = $1 AND status = 'active' FOR UPDATE",
          [toAccountNumber]
        );
        if (toResult.rows.length > 0) toAccount = toResult.rows[0];
      }

      const newFromBalance = parseFloat(fromAccount.balance) - totalDebit;

      await client.query(
        'UPDATE accounts SET balance = $1, available_balance = $1, last_transaction_date = NOW(), updated_at = NOW() WHERE id = $2',
        [newFromBalance, fromAccountId]
      );

      if (toAccount) {
        const newToBalance = parseFloat(toAccount.balance) + parseFloat(amount);
        await client.query(
          'UPDATE accounts SET balance = $1, available_balance = $1, last_transaction_date = NOW(), updated_at = NOW() WHERE id = $2',
          [newToBalance, toAccount.id]
        );
      }

      const txnRef = generateReference();
      const txnResult = await client.query(
        `INSERT INTO transactions (
          tenant_id, transaction_reference, transaction_type, payment_type,
          debit_account_id, credit_account_id,
          debit_account_number, credit_account_number,
          amount, currency, fee, net_amount, description,
          status, initiated_by, processed_at, value_date,
          beneficiary_name, beneficiary_bank, beneficiary_account
        ) VALUES ($1,$2,'transfer',$3,$4,$5,$6,$7,$8,$9,$10,$8,$11,'completed',$12,NOW(),CURRENT_DATE,$13,$14,$15)
        RETURNING *`,
        [
          tenantId, txnRef, paymentType,
          fromAccountId, toAccount?.id || null,
          fromAccount.account_number, toAccount?.account_number || toAccountNumber || null,
          amount, fromAccount.currency, fee,
          description || 'Fund Transfer', userId,
          beneficiaryName, beneficiaryBank, toAccountNumber
        ]
      );

      return {
        transaction: txnResult.rows[0],
        fromNewBalance: newFromBalance,
        fee
      };
    });
  }

  async getTransactions(tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, accountId, type, status, startDate, endDate, search } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['t.tenant_id = $1'];
    const params: any[] = [tenantId];
    let pc = 1;

    if (accountId) { pc++; conditions.push(`(t.debit_account_id = $${pc} OR t.credit_account_id = $${pc})`); params.push(accountId); }
    if (type) { pc++; conditions.push(`t.transaction_type = $${pc}`); params.push(type); }
    if (status) { pc++; conditions.push(`t.status = $${pc}`); params.push(status); }
    if (startDate) { pc++; conditions.push(`t.created_at >= $${pc}`); params.push(startDate); }
    if (endDate) { pc++; conditions.push(`t.created_at <= $${pc}`); params.push(endDate); }
    if (search) { pc++; conditions.push(`(t.transaction_reference ILIKE $${pc} OR t.description ILIKE $${pc} OR t.beneficiary_name ILIKE $${pc})`); params.push(`%${search}%`); }

    const where = conditions.join(' AND ');
    const [rows, count] = await Promise.all([
      Database.query(`SELECT t.* FROM transactions t WHERE ${where} ORDER BY t.created_at DESC LIMIT $${pc+1} OFFSET $${pc+2}`, [...params, limit, offset]),
      Database.query(`SELECT COUNT(*) as total FROM transactions t WHERE ${where}`, params)
    ]);

    return {
      transactions: rows.rows,
      pagination: { total: parseInt(count.rows[0].total), page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(parseInt(count.rows[0].total) / limit) }
    };
  }

  async reverseTransaction(txnId: string, reason: string, userId: string, tenantId: string): Promise<any> {
    return Database.transaction(async (client) => {
      const txnResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
        [txnId, tenantId]
      );
      if (txnResult.rows.length === 0) throw new AppError('Transaction not found', 404);

      const txn = txnResult.rows[0];
      if (txn.status !== 'completed') throw new AppError('Only completed transactions can be reversed', 400);
      if (txn.reversed_at) throw new AppError('Transaction already reversed', 400);

      // Reverse balances
      if (txn.credit_account_id) {
        await client.query(
          'UPDATE accounts SET balance = balance - $1, available_balance = available_balance - $1, updated_at = NOW() WHERE id = $2',
          [txn.amount, txn.credit_account_id]
        );
      }
      if (txn.debit_account_id) {
        await client.query(
          'UPDATE accounts SET balance = balance + $1, available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
          [parseFloat(txn.amount) + parseFloat(txn.fee || 0), txn.debit_account_id]
        );
      }

      await client.query(
        'UPDATE transactions SET status = $1, reversed_at = NOW(), reversal_reason = $2, approved_by = $3 WHERE id = $4',
        ['reversed', reason, userId, txnId]
      );

      return { message: 'Transaction reversed successfully', transactionId: txnId };
    });
  }

  async getDashboardStats(tenantId: string): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const [volumeRes, countRes, typeRes] = await Promise.all([
      Database.query(
        `SELECT COALESCE(SUM(amount), 0) as volume FROM transactions WHERE tenant_id = $1 AND DATE(created_at) = $2 AND status = 'completed'`,
        [tenantId, today]
      ),
      Database.query(
        `SELECT status, COUNT(*) as count FROM transactions WHERE tenant_id = $1 AND DATE(created_at) = $2 GROUP BY status`,
        [tenantId, today]
      ),
      Database.query(
        `SELECT transaction_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE tenant_id = $1 AND DATE(created_at) = $2 GROUP BY transaction_type`,
        [tenantId, today]
      )
    ]);

    return {
      todayVolume: volumeRes.rows[0].volume,
      statusBreakdown: countRes.rows,
      typeBreakdown: typeRes.rows
    };
  }

  private async getDailyTransferTotal(accountId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const result = await Database.query(
      `SELECT COALESCE(SUM(amount + fee), 0) as total FROM transactions WHERE debit_account_id = $1 AND DATE(created_at) = $2 AND status IN ('completed', 'pending')`,
      [accountId, today]
    );
    return parseFloat(result.rows[0].total);
  }
}

export class TransactionController {
  private service = new TransactionService();

  deposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deposit(req.body, (req as any).user.id, (req as any).tenantId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.withdraw(req.body, (req as any).user.id, (req as any).tenantId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.transfer(req.body, (req as any).user.id, (req as any).tenantId);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getTransactions((req as any).tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  };

  reverse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const result = await this.service.reverseTransaction(req.params.id, reason, (req as any).user.id, (req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getDashboardStats((req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };
}
