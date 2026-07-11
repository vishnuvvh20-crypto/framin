import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../db/database';
import { Task } from '../db/models/Task';
import { withObservables } from '@nozbe/watermelondb/react';
import { useLanguage } from '../context/LanguageContext';

const TaskDetailBase = ({ task, navigation }: { task: Task, navigation: any }) => {
  const { colors, typography } = useTheme();
  const { t } = useLanguage();

  const handleToggleStatus = async () => {
    try {
      await database.write(async () => {
        await task.update((t) => {
          t.status = t.status === 'completed' ? 'pending' : 'completed';
        });
      });
      Alert.alert(t('alert_updated'), task.status === 'completed' ? t('alert_task_marked_completed') : t('alert_task_marked_pending'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('alert_error'), t('alert_task_update_error'));
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('alert_delete_task'),
      t('alert_confirm_remove_schedule'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive', 
          onPress: async () => {
            await database.write(async () => {
              await task.markAsDeleted();
              navigation.goBack();
            });
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[typography.header, { flex: 1 }]}>{task.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: task.status === 'completed' ? colors.primary : colors.error }]}>
            <Text style={styles.statusText}>{task.status === 'completed' ? t('status_completed') : t('status_pending')}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <View style={styles.rowContent}>
            <Text style={[typography.caption, { color: colors.textLight }]}>{t('date')}</Text>
            <Text style={[typography.body, { fontWeight: '600' }]}>{task.dueDate.toDateString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <View style={styles.rowContent}>
            <Text style={[typography.caption, { color: colors.textLight }]}>{t('notes')}</Text>
            <Text style={typography.body}>{task.notes || t('task_no_notes')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.mainBtn, { backgroundColor: colors.primary }]} 
          onPress={handleToggleStatus}
        >
          <Ionicons name={task.status === 'completed' ? 'arrow-undo-outline' : 'checkmark-done'} size={24} color="#fff" />
          <Text style={styles.btnText}>
            {task.status === 'completed' ? t('task_reopen') : t('task_complete')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.deleteBtn, { borderColor: colors.error }]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.deleteText, { color: colors.error }]}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const TaskDetailScreen = withObservables(['route'], ({ route }: any) => ({
  task: database.collections.get<Task>('tasks').findAndObserve(route.params.taskId),
}))(TaskDetailBase);

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: spacing.md, borderRadius: 16, padding: spacing.xl, elevation: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  rowContent: { marginLeft: spacing.lg },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.md },
  actions: { padding: spacing.md },
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  deleteText: { fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
