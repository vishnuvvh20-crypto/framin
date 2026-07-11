import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Inventory extends Model {
  static table = 'inventory';

  @field('farm_id') farmId!: string;
  @field('item_name') itemName!: string;
  @field('category') category!: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('low_stock_threshold') lowStockThreshold?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
