import { Request, Response, NextFunction } from 'express';
import { Database } from '../../config/database.config';
import { RedisClient } from '../../config/redis.config';
import { AppError } from '../../common/middleware/error.middleware';
import { logger } from '../../config/logger.config';

interface FraudIndicator {
  type: string;
  score: number;
  description: string;
}

export class FraudDetectionService {

  async analyzeTransaction(txnData: any): Promise<{ score: number; indicators: FraudIndicator[]; action: string }> {
    const indicators: FraudIndicator[] = [];
    let totalScore = 0;

    // 1. Velocity check - multiple transactions in short time
    const velocityScore = await this.checkVelocity(txnData.accountId, txnData.amount);
    if (velocityScore > 0) {
      indicators.push({ type: 'velocity', score: velocityScore, description: 'Unusual transaction frequency' });
      totalScore += velocityScore;
    }

    // 2. Amount anomaly - unusually large or round amounts
    const amountScore = this.checkAmountAnomaly(txnData.amount, txnData.avgAmount);
    if (amountScore > 0) {
      indicators.push({ type: 'amount_anomaly', score: amountScore, description: 'Unusual transaction amount' });
      totalScore += amountScore;
    }

    // 3. Time-based check - transactions at unusual hours
    const timeScore = this.checkTimeAnomaly();
    if (timeScore > 0) {
      indicators.push({ type: 'time_anomaly', score: timeScore, description: 'Transaction at unusual hour' });
      totalScore += timeScore;
    }

    // 4. Geographic anomaly
    const geoScore = await this.checkGeographicAnomaly(txnData.accountId, txnData.ip);
    if (geoScore > 0) {
      indicators.push({ type: 'geo_anomaly', score: geoScore, description: 'Transaction from unusual location' });
      totalScore += geoScore;
    }

    // 5. AML threshold check
    const amlScore = this.checkAMLThreshold(txnData.amount);
    if (amlScore > 0) {
      indicators.push({ type: 'aml_threshold', score: amlScore, description: 'Transaction near/above AML reporting threshold' });
      totalScore += amlScore;
    }

    // 6. Pattern check - structuring detection
    const structuringScore = await this.checkStructuring(txnData.accountId, txnData.amount);
    if (structuringScore > 0) {
      indicators.push({ type: 'structuring', score: structuringScore, description: 'Possible transaction structuring detected' });
      totalScore += structuringScore;
    }

    // 7. Beneficiary risk check
    if (txnData.beneficiaryAccount) {
      const beneficiaryScore = await this.checkBeneficiaryRisk(txnData.beneficiaryAccount);
      if (beneficiaryScore > 0) {
        indicators.push({ type: 'beneficiary_risk', score: beneficiaryScore, description: 'High-risk beneficiary account' });
        totalScore += beneficiaryScore;
      }
    }

    const normalizedScore = Math.min(100, totalScore);
    const action = normalizedScore >= 80 ? 'block' : normalizedScore >= 50 ? 'review' : 'allow';

    return { score: normalizedScore, indicators, action };
  }

  private async checkVelocity(accountId: string, amount: number): Promise<number> {
    try {
      const key = `velocity:${accountId}`;
      const count = await RedisClient.incr(key);
      if (count === 1) await RedisClient.expire(key, 3600); // 1 hour window

      if (count > 20) return 40;
      if (count > 10) return 20;
      if (count > 5) return 10;
      return 0;
    } catch {
      return 0;
    }
  }

  private checkAmountAnomaly(amount: number, avgAmount?: number): number {
    if (!avgAmount) {
      // High amount heuristics
      if (amount > 5000000) return 30;
      if (amount > 1000000) return 15;
      return 0;
    }

    const ratio = amount / avgAmount;
    if (ratio > 10) return 35;
    if (ratio > 5) return 20;
    if (ratio > 3) return 10;
    return 0;
  }

  private checkTimeAnomaly(): number {
    const hour = new Date().getHours();
    // Unusual hours: 1 AM - 5 AM
    if (hour >= 1 && hour <= 5) return 15;
    return 0;
  }

  private async checkGeographicAnomaly(accountId: string, ip?: string): Promise<number> {
    // Simplified geo check - in production would use MaxMind GeoIP
    if (!ip || ip === '127.0.0.1' || ip === '::1') return 0;
    return 0;
  }

  private checkAMLThreshold(amount: number): number {
    // Pakistan SBP CTR threshold: PKR 2.5M
    const CTR_THRESHOLD = 2500000;
    const STRUCTURING_THRESHOLD = CTR_THRESHOLD * 0.9;

    if (amount >= CTR_THRESHOLD) return 30;
    if (amount >= STRUCTURING_THRESHOLD) return 20;
    return 0;
  }

  private async checkStructuring(accountId: string, amount: number): Promise<number> {
    // Check if customer is making multiple transactions just below threshold
    const THRESHOLD = 2500000;
    if (amount >= THRESHOLD * 0.8 && amount < THRESHOLD) {
      try {
        const result = await Database.query(
          `SELECT COUNT(*) as count FROM transactions
           WHERE debit_account_id = $1 AND amount >= $2 AND created_at >= NOW() - INTERVAL '24 hours'`,
          [accountId, THRESHOLD * 0.8]
        );
        const count = parseInt(result.rows[0].count);
        if (count >= 3) return 45;
        if (count >= 2) return 25;
      } catch {}
    }
    return 0;
  }

  private async checkBeneficiaryRisk(beneficiaryAccount: string): Promise<number> {
    try {
      const result = await Database.query(
        `SELECT COUNT(*) as alert_count FROM compliance_alerts ca
         JOIN accounts a ON ca.account_id = a.id
         WHERE a.account_number = $1 AND ca.status = 'open'`,
        [beneficiaryAccount]
      );
      const count = parseInt(result.rows[0].alert_count);
      if (count > 0) return count * 15;
    } catch {}
    return 0;
  }

  async createAlert(txnId: string, customerId: string, score: number, indicators: FraudIndicator[], tenantId: string): Promise<void> {
    await Database.query(
      `INSERT INTO fraud_alerts (tenant_id, transaction_id, customer_id, alert_type, fraud_score, indicators, status)
       VALUES ($1, $2, $3, 'automated', $4, $5, 'open')`,
      [tenantId, txnId, customerId, score, JSON.stringify(indicators)]
    );

    // Also create compliance alert if high score
    if (score >= 70) {
      await Database.query(
        `INSERT INTO compliance_alerts (tenant_id, transaction_id, customer_id, alert_type, severity, description, risk_score, status)
         VALUES ($1, $2, $3, 'fraud_detected', $4, $5, $6, 'open')`,
        [tenantId, txnId, customerId,
         score >= 80 ? 'critical' : 'high',
         `Automated fraud detection alert. Score: ${score}`,
         score]
      );
    }
  }

  async getAlerts(tenantId: string, filters: any): Promise<any> {
    const { page = 1, limit = 20, status, minScore } = filters;
    const offset = (page - 1) * limit;
    const conds = ['fa.tenant_id = $1'];
    const params: any[] = [tenantId];
    let pc = 1;

    if (status) { pc++; conds.push(`fa.status = $${pc}`); params.push(status); }
    if (minScore) { pc++; conds.push(`fa.fraud_score >= $${pc}`); params.push(minScore); }

    const where = conds.join(' AND ');
    const result = await Database.query(
      `SELECT fa.*, c.full_name as customer_name, t.transaction_reference, t.amount
       FROM fraud_alerts fa
       LEFT JOIN customers c ON fa.customer_id = c.id
       LEFT JOIN transactions t ON fa.transaction_id = t.id
       WHERE ${where}
       ORDER BY fa.created_at DESC LIMIT $${pc+1} OFFSET $${pc+2}`,
      [...params, limit, offset]
    );

    const count = await Database.query(`SELECT COUNT(*) as total FROM fraud_alerts fa WHERE ${where}`, params);

    return {
      alerts: result.rows,
      pagination: { total: parseInt(count.rows[0].total), page: parseInt(page), limit: parseInt(limit) }
    };
  }

  async reviewAlert(alertId: string, action: string, notes: string, userId: string): Promise<any> {
    const result = await Database.query(
      `UPDATE fraud_alerts SET status = $1, action_taken = $1, reviewed_by = $2, reviewed_at = NOW(), notes = $3
       WHERE id = $4 RETURNING *`,
      [action === 'clear' ? 'cleared' : 'confirmed', userId, notes, alertId]
    );
    if (result.rows.length === 0) throw new AppError('Alert not found', 404);
    return result.rows[0];
  }

  async getFraudStats(tenantId: string): Promise<any> {
    const [overall, byScore, recent] = await Promise.all([
      Database.query(
        `SELECT status, COUNT(*) as count, AVG(fraud_score) as avg_score FROM fraud_alerts WHERE tenant_id = $1 GROUP BY status`,
        [tenantId]
      ),
      Database.query(
        `SELECT CASE WHEN fraud_score >= 80 THEN 'critical' WHEN fraud_score >= 50 THEN 'high' ELSE 'medium' END as risk_level, COUNT(*) as count
         FROM fraud_alerts WHERE tenant_id = $1 GROUP BY risk_level`,
        [tenantId]
      ),
      Database.query(
        `SELECT COUNT(*) as count FROM fraud_alerts WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
        [tenantId]
      )
    ]);

    return { overall: overall.rows, byRiskLevel: byScore.rows, last24h: recent.rows[0].count };
  }
}

export class FraudController {
  private service = new FraudDetectionService();

  getAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAlerts((req as any).tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  };

  reviewAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, notes } = req.body;
      const result = await this.service.reviewAlert(req.params.id, action, notes, (req as any).user.id);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getFraudStats((req as any).tenantId);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };
}
