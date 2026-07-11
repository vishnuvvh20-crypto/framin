import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../db/database';
import { Transaction } from '../db/models/Transaction';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Q } from '@nozbe/watermelondb';

const formatDate = (date: Date) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${dayName}, ${monthName} ${day} ${year}`;
};

const formatTime = (date: Date) => {
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('fertilizer') || cat.includes('shop') || cat.includes('buy')) return 'cart-outline';
  if (cat.includes('crop') || cat.includes('sale') || cat.includes('harvest')) return 'leaf-outline';
  if (cat.includes('irrigation') || cat.includes('water')) return 'water-outline';
  if (cat.includes('repair') || cat.includes('lease') || cat.includes('tractor')) return 'construct-outline';
  return 'cash-outline';
};

const TransactionsList = ({ transactions, filter, searchQuery, t }: { transactions: Transaction[], filter: string, searchQuery: string, t: any }) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  // 1. Calculate Totals (on all transactions before filtering)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const availableBalance = totalIncome - totalExpense;

  // 2. Filter Transactions
  let filtered = transactions;
  if (filter === 'EXPENSES') {
    filtered = transactions.filter(t => t.type === 'expense');
  } else if (filter === 'INCOME') {
    filtered = transactions.filter(t => t.type === 'income');
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => {
      const d = new Date(t.transactionDate);
      const dateStr = formatDate(d).toLowerCase();
      return (
        t.title.toLowerCase().includes(q) || 
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        dateStr.includes(q)
      );
    });
  }

  // 3. Group by Date
  const grouped: Record<string, Transaction[]> = {};
  filtered.forEach(t => {
    // WatermelonDB Date fields might be returned as numeric timestamps depending on how they are saved, so safely convert:
    const d = new Date(t.transactionDate);
    const dateStr = formatDate(d);
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(t);
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* BALANCE CARDS */}
      <View style={styles.cardsSection}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('total_balance').toUpperCase()}</Text>
          <Text style={styles.balanceAmount}>₹ {availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('income').toUpperCase()}</Text>
            <Text style={styles.incomeText}>+₹{totalIncome.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statIconContainerIncome}>
            <Ionicons name="trending-up" size={18} color="#13702a" />
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('expense').toUpperCase()}</Text>
            <Text style={styles.expenseText}>-₹{totalExpense.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statIconContainerExpense}>
            <Ionicons name="trending-down" size={18} color="#ba1a1a" />
          </View>
        </View>
      </View>

      {/* TRANSACTION LIST */}
      <View style={[styles.listSection, { backgroundColor: colors.background }]}>
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.endHistoryContainer}>
            <Text style={[styles.endHistoryText, { color: colors.textLight }]}>No transactions found.</Text>
          </View>
        ) : (
          Object.keys(grouped).map(dateKey => (
            <React.Fragment key={dateKey}>
              <View style={styles.dateHeaderContainer}>
                <View style={styles.dateDot} />
                <Text style={styles.dateHeader}>{dateKey}</Text>
              </View>

              {grouped[dateKey].map(txn => {
                const isExpense = txn.type === 'expense';
                return (
                  <TouchableOpacity 
                    style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} 
                    key={txn.id}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: txn.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.txnLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: isExpense ? '#ffeaea' : '#e6f4ea' }]}>
                        <Ionicons name={getCategoryIcon(txn.title + ' ' + txn.category)} size={20} color={isExpense ? "#ba1a1a" : "#13702a"} />
                      </View>
                      <View style={styles.txnDetails}>
                        <Text style={[styles.txnTitle, { color: colors.text }]}>{txn.title}</Text>
                        <Text style={[styles.txnSub, { color: colors.textLight }]}>{txn.category || 'General'} • {formatTime(new Date(txn.transactionDate))}</Text>
                      </View>
                    </View>
                    <View style={styles.txnRight}>
                      <Text style={isExpense ? styles.txnExpense : styles.txnIncome}>
                        {isExpense ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#aaa" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          ))
        )}

        {Object.keys(grouped).length > 0 && (
          <View style={styles.endHistoryContainer}>
            <Ionicons name="time-outline" size={32} color="#ccc" style={{ marginBottom: 5 }} />
            <Text style={styles.endHistoryText}>End of recent history</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const EnhancedTransactionsList = withObservables([], () => ({
  transactions: database.collections.get<Transaction>('transactions').query(Q.sortBy('transaction_date', Q.desc)).observe(),
}))(TransactionsList);


export const TransactionsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP NAVBAR */}
      <View style={styles.topNavbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Feather name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.primary }]}>Farmin</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* TOP SEARCH & FILTERS */}
      <View style={[styles.topSection, { backgroundColor: colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="search-outline" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'ALL' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFilter('ALL')}
          >
            {filter === 'ALL' && <Ionicons name="filter" size={12} color="#fff" style={{ marginRight: 6 }} />}
            <Text style={[styles.filterText, filter === 'ALL' ? styles.filterTextActive : { color: colors.text }]}>ALL FILTERS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'EXPENSES' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFilter('EXPENSES')}
          >
            <Text style={[styles.filterText, filter === 'EXPENSES' ? styles.filterTextActive : { color: colors.text }]}>{t('expense').toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'INCOME' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFilter('INCOME')}
          >
            <Text style={[styles.filterText, filter === 'INCOME' ? styles.filterTextActive : { color: colors.text }]}>{t('income').toUpperCase()}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <EnhancedTransactionsList filter={filter} searchQuery={searchQuery} t={t} />

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.mainFab} onPress={() => navigation.navigate('TransactionForm')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  topNavbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navTitle: { fontSize: 20, fontWeight: '700', color: '#005a2b' },
  separator: { height: 1, backgroundColor: '#f0f0f0', width: '100%' },

  topSection: { backgroundColor: '#f2f5f4', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 15, elevation: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  
  filtersScroll: { flexDirection: 'row' },
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#eaeaeb' },
  filterPillActive: { backgroundColor: '#218c3a', borderColor: '#218c3a' },
  filterText: { fontSize: 9, fontWeight: '800', color: '#555', letterSpacing: 0.5 },
  filterTextActive: { color: '#fff' },

  cardsSection: { paddingHorizontal: 20, paddingTop: 20 },
  balanceCard: { backgroundColor: '#218c3a', borderRadius: 12, padding: 20, marginBottom: 15, elevation: 2 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  balanceAmount: { color: '#fff', fontSize: 28, fontWeight: '700' },
  
  statsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 1 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#555', letterSpacing: 0.5, marginBottom: 5 },
  incomeText: { fontSize: 16, fontWeight: '700', color: '#13702a' },
  expenseText: { fontSize: 16, fontWeight: '700', color: '#ba1a1a' },
  statIconContainerIncome: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#b3f2c5', justifyContent: 'center', alignItems: 'center' },
  statIconContainerExpense: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fcd3d3', justifyContent: 'center', alignItems: 'center' },

  listSection: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#f3f6f4', flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 10 },
  
  dateHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 15, paddingHorizontal: 5 },
  dateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#13702a', marginRight: 8 },
  dateHeader: { fontSize: 10, fontWeight: '800', color: '#13702a', letterSpacing: 0.5 },

  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  txnLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  txnDetails: { flex: 1 },
  txnTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  txnSub: { fontSize: 10, color: '#888', fontWeight: '500' },
  
  txnRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txnExpense: { fontSize: 13, fontWeight: '700', color: '#ba1a1a' },
  txnIncome: { fontSize: 13, fontWeight: '700', color: '#13702a' },

  endHistoryContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 20 },
  endHistoryText: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  fabContainer: { position: 'absolute', bottom: 20, right: 20, alignItems: 'center' },
  mainFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#218c3a', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
