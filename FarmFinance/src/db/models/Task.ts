import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Task extends Model {
  static table = 'tasks';

  @field('farm_id') farmId!: string;
  @field('title') title!: string;
  @field('notes') notes?: string;
  @date('due_date') dueDate!: Date;
  @field('status') status!: 'pending' | 'completed' | 'missed';
  @field('category') category?: string;
  @field('plot_id') plotId?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
