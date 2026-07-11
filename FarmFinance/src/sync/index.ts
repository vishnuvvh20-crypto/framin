import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db/database';
import { supabase, isCloudReady } from '../services/supabase';

/**
 * High-Fidelity Cloud Synchronization Engine
 */
export async function syncWithSupabase() {
  if (!isCloudReady) {
    console.log('Cloud not ready: Synchronizing local-only mode.');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.warn('Sync aborted: No active session. Data remains local-only.');
    return;
  }

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const timestamp = lastPulledAt ? new Date(lastPulledAt).toISOString() : new Date(0).toISOString();

      try {
        // We attempt to call a unified RPC function. 
        // If not available, you would query each table separately.
        const { data, error } = await supabase.rpc('pull_farmin_data', { last_pulled_at: timestamp });

        if (error) throw error;

        return {
          changes: data.changes,
          timestamp: data.timestamp,
        };
      } catch (err) {
        console.warn('Cloud pull failed. Verify Supabase RPC "pull_farmin_data" exists.', err);
        return {
          changes: {
            transactions: { created: [], updated: [], deleted: [] },
            tasks: { created: [], updated: [], deleted: [] },
            notes: { created: [], updated: [], deleted: [] },
            budgets: { created: [], updated: [], deleted: [] },
            inventory: { created: [], updated: [], deleted: [] },
          },
          timestamp: lastPulledAt || Date.now(),
        };
      }
    },
    pushChanges: async ({ changes }) => {
      try {
        const { error } = await supabase.rpc('push_farmin_data', { changes });
        if (error) throw error;
      } catch (err) {
        console.warn('Cloud push failed. Verify Supabase RPC "push_farmin_data" exists.', err);
      }
    },
    migrationsEnabledAtVersion: 1,
  });
}
