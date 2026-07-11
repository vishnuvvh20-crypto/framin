import { database } from '../../db/database';
import { ApiService } from '../services/ApiService';

export class TransactionRepository {
  static async save(
    type: 'income' | 'expense',
    title: string,
    amount: number,
    notes: string
  ): Promise<void> {
    // 1. Save to local WatermelonDB
    await database.write(async () => {
      await database.collections.get('transactions').create((record: any) => {
        record.farmId = 'main-farm';
        record.userId = 'user-1';
        record.type = type;
        record.title = title;
        record.amount = amount;
        record.notes = notes;
        record.transactionDate = new Date();
      });
    });

    // 2. Save to MySQL backend
    try {
      const endpoint = type === 'income' ? '/income' : '/expense';
      const payload: any = {
        amount,
        description: notes,
        date: new Date().toISOString()
      };

      if (type === 'income') {
        payload.source = title;
      } else {
        payload.category = title;
      }

      await ApiService.post(endpoint, payload);
    } catch (backendError) {
      console.log('Failed to save to MySQL backend. It might be off:', backendError);
    }
  }

  static async getAll() {
    return database.collections.get('transactions').query().fetch();
  }
}
