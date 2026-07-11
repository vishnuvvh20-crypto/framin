import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Transaction extends Model {
  static table = 'transactions';

  @field('farm_id') farmId!: string;
  @field('user_id') userId!: string;
  @field('type') type!: 'income' | 'expense';
  @field('amount') amount!: number;
  @field('title') title!: string; // Added title field
  @field('vendor') vendor!: string;
  @field('category') category!: string;
  @field('notes') notes!: string;
  @field('receipt_url') receiptUrl!: string;
  @date('transaction_date') transactionDate!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
