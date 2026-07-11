import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Transaction } from './models/Transaction';
import { Task } from './models/Task';
import { Budget } from './models/Budget';
import { Inventory } from './models/Inventory';
import { Note } from './models/Note'; // New import

const adapter = new SQLiteAdapter({
  schema,
  jsi: false,
});

export const database = new Database({
  adapter,
  modelClasses: [Transaction, Task, Budget, Inventory, Note], // Added Note
});
