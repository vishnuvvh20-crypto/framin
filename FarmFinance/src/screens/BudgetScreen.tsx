import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { database } from '../db/database';
import { Budget } from '../db/models/Budget';
import { Transaction } from '../db/models/Transaction';
import { spacing } from '../theme';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Helper component that observes transactions to calculate spending
const BudgetItemInner = ({ budget, transactions }: { budget: Budget; transactions: Transaction[] }) => {
  const { colors, typography } = useTheme();

  const spent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const percentage = Math.min((spent / budget.amount) * 100, 100);

  let progressColor = colors.success;
  if (percentage >= 100) progressColor = colors.error;
  else if (percentage >= 80) progressColor = colors.secondary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.title, { marginBottom: 2 }]}>{budget.category}</Text>
          <Text style={[typography.caption, { color: colors.textLight }]}>{budget.season || 'Annual Budget'}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert('Delete Budget', 'Remove this budget plan?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                await database.write(async () => {
                  await budget.markAsDeleted();
                });
              }}
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressRow}>
        <Text style={[typography.body, { fontWeight: 'bold' }]}>${spent.toFixed(2)} Spent</Text>
        <Text style={[typography.caption]}>of ${budget.amount.toFixed(2)}</Text>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
      </View>

      {percentage >= 100 && <Text style={[styles.alertText, { color: colors.error }]}>OVER BUDGET</Text>}
      {percentage >= 80 && percentage < 100 && (
        <Text style={[styles.warningText, { color: colors.secondary }]}>Nearing limit (80% used)</Text>
      )}
    </View>
  );
};

const BudgetItem = withObservables(['budget'], ({ budget }: { budget: Budget }) => ({
  budget,
  transactions: database.collections
    .get<Transaction>('transactions')
    .query(
      // Match by title/category
      Q.where('title', Q.like(`%${budget.category}%`)),
      Q.where('type', 'expense')
    ),
}))(BudgetItemInner);

const BudgetList = ({ budgets }: { budgets: Budget[] }) => {
  const { colors, typography } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [season, setSeason] = useState('');
  const [amount, setAmount] = useState('');

  const handleCreateBudget = async () => {
    if (!budgetTitle || !amount) {
      Alert.alert('Error', 'Please enter a title and amount');
      return;
    }

    try {
      await database.write(async () => {
        await database.collections.get<Budget>('budgets').create((b) => {
          b.farmId = 'main-farm';
          b.category = budgetTitle;
          b.amount = Number(amount);
          b.season = season;
        });
      });
      setBudgetTitle(''); setSeason(''); setAmount('');
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save budget');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[typography.header]}>Seasonal Budgets</Text>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <BudgetItem budget={item} />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[typography.title, { marginBottom: 15 }]}>Create Budget Plan</Text>
              
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} 
                placeholder="Budget Title (e.g. Fertilizer)" 
                value={budgetTitle} 
                onChangeText={setBudgetTitle} 
              />
              
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} 
                placeholder="Season (e.g. Summer 2026)" 
                value={season} 
                onChangeText={setSeason} 
              />

              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} 
                placeholder="Limit Amount ($)" 
                keyboardType="numeric"
                value={amount} 
                onChangeText={setAmount} 
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={{ color: colors.error }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateBudget} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, alignItems: 'center', elevation: 3 },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginVertical: spacing.sm },
  progressBarFill: { height: '100%', borderRadius: 5 },
  alertText: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  warningText: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalContent: { borderRadius: 20, padding: 30 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
  cancelBtn: { marginRight: 25 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
});

export const BudgetScreen = withObservables([], () => ({
  budgets: database.collections.get<Budget>('budgets').query(Q.sortBy('created_at', Q.desc))
}))(BudgetList);
