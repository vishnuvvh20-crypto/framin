import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { Transaction } from './models/Transaction';
import { Task } from './models/Task';
import { Budget } from './models/Budget';
import { Inventory } from './models/Inventory';
import { Note } from './models/Note';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

export const database = new Database({
  adapter,
  modelClasses: [Transaction, Task, Budget, Inventory, Note],
});
