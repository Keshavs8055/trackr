import { AuditLogEntry, ProviderName } from '@/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export class AuditLogService {
  private logs: AuditLogEntry[] = [];

  public async logAction(
    userId: string,
    action: AuditLogEntry['action'],
    provider: ProviderName | string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: userId || 'mock-user-id',
      action,
      provider,
      details,
      timestamp: Date.now(),
    };

    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();

    if (userId && userId !== 'mock-user-id') {
      try {
        await addDoc(collection(db, 'users', userId, 'audit_logs'), entry);
      } catch (err) {
        console.warn("Failed to write audit log to Firestore:", err);
      }
    }
  }

  public getRecentLogs(): AuditLogEntry[] {
    return this.logs;
  }
}

export const auditLogService = new AuditLogService();
