import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Budget extends Model {
  static table = 'budgets';

  @field('farm_id') farmId!: string;
  @field('category') category!: string;
  @field('amount') amount!: number;
  @field('season') season?: string;
  @date('start_date') startDate?: Date;
  @date('end_date') endDate?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
