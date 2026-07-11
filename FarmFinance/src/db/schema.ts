import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 5, // Upgraded for Universal User Isolation (user_id for all tables)
  tables: [
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, 
        { name: 'amount', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'vendor', type: 'string', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'receipt_url', type: 'string', isOptional: true },
        { name: 'transaction_date', type: 'number' }, 
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'due_date', type: 'number', isIndexed: true },
        { name: 'status', type: 'string' }, 
        { name: 'category', type: 'string', isOptional: true },
        { name: 'plot_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'category', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'season', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'inventory',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'item_name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'low_stock_threshold', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
