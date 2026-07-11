import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../db/database';
import { Transaction } from '../db/models/Transaction';
import { Q } from '@nozbe/watermelondb';
import { syncWithSupabase } from '../sync';

const formatDate = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${months[date.getMonth()]}-${year}`;
};

const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('fertilizer') || cat.includes('shop') || cat.includes('buy')) return 'cart-outline';
  if (cat.includes('crop') || cat.includes('sale') || cat.includes('harvest')) return 'leaf-outline';
  if (cat.includes('irrigation') || cat.includes('water')) return 'water-outline';
  if (cat.includes('repair') || cat.includes('lease') || cat.includes('tractor')) return 'construct-outline';
  return 'cash-outline';
};

const DashboardContent = ({ transactions, navigation, colors, isDark, t }: { transactions: Transaction[], navigation: any, colors: any, isDark: boolean, t: any }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate Totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const availableBalance = totalIncome - totalExpense;

  // Get Top 3 Recent Transactions
  const recentTransactions = transactions.slice(0, 3);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
      if (Platform.OS === 'web') {
        window.alert('Data synchronized successfully!');
      } else {
        Alert.alert('Success', 'Data synchronized successfully!');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Could not sync with cloud.');
      } else {
        Alert.alert('Sync Failed', 'Could not sync with cloud.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('dashboard')}</Text>
            <View style={[styles.secureBadge, { backgroundColor: isDark ? colors.border : '#e0efe5' }]}>
              <Text style={[styles.secureText, { color: colors.primary }]}>SECURE</Text>
            </View>
          </View>
        </View>

        {/* ASSET OVERVIEW */}
        <View style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.assetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>ASSET OVERVIEW</Text>
            <View style={styles.liveBadge}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#0a7a3a" />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.assetBody}>
            <View>
              <Text style={[styles.netLiquidityLabel, { color: colors.textLight }]}>Net Liquidity</Text>
              <Text style={[styles.netLiquidityValue, { color: colors.text }]}>₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.background : '#e8ecea' }]}>
              <View style={[styles.chartBar, { height: 8, backgroundColor: '#8db799' }]} />
              <View style={[styles.chartBar, { height: 12, backgroundColor: '#8db799' }]} />
              <View style={[styles.chartBar, { height: 10, backgroundColor: '#4c9b68' }]} />
              <View style={[styles.chartBar, { height: 18, backgroundColor: '#13702a' }]} />
              <View style={[styles.chartBar, { height: 6, backgroundColor: '#8db799' }]} />
            </View>
          </View>

          <View style={styles.assetFooter}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('income').toUpperCase()}</Text>
              <Text style={[styles.totalValue, { color: '#13702a' }]}>₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('expense').toUpperCase()}</Text>
              <Text style={[styles.totalValue, { color: '#ba1a1a' }]}>₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: isDark ? colors.card : '#eef6f0', borderColor: isDark ? colors.border : '#bad6c3' }]} onPress={handleSync} disabled={isSyncing}>
            {isSyncing ? (
               <ActivityIndicator size="small" color={colors.primary} />
            ) : (
               <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
            )}
            <Text style={[styles.syncBtnText, { color: colors.primary }]}>{isSyncing ? 'Syncing...' : 'Push Sync'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.printBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
            if (Platform.OS === 'web') {
              window.print();
            } else {
              Alert.alert('Print', 'Please visit the Reports tab to generate reports.');
            }
          }}>
            <Ionicons name="print-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.activityHeader}>
          <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVITY LIST */}
        {recentTransactions.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
             <Text style={{ color: colors.textLight }}>No transactions found.</Text>
          </View>
        ) : (
          recentTransactions.map(txn => {
            const isExpense = txn.type === 'expense';
            return (
              <TouchableOpacity 
                key={txn.id} 
                style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: txn.id })}
              >
                <View style={styles.activityLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isExpense ? '#ffeaea' : '#e6f4ea' }]}>
                    <Ionicons name={getCategoryIcon(txn.title + ' ' + txn.category)} size={18} color={isExpense ? "#ba1a1a" : "#13702a"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{txn.title}</Text>
                    <Text style={[styles.activitySub, { color: colors.textLight }]}>{formatDate(new Date(txn.transactionDate))}  •  {isExpense ? 'DEBIT' : 'CREDIT'}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                  <Text style={[styles.activityAmount, { color: isExpense ? '#ba1a1a' : '#13702a' }]}>
                    {isExpense ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.activityStatus}>SUCCESS</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* WEEKLY MARGIN */}
        <View style={[styles.marginCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.marginHeader}>
            <Text style={[styles.marginText, { color: colors.text }]}>Weekly Margin</Text>
            <Text style={[styles.marginPercent, { color: colors.primary }]}>+12%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.background : '#eaeaeb' }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.miniFab, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('CalculatorTool')}>
          <Ionicons name="calculator-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const EnhancedDashboardContent = withObservables([], () => ({
  transactions: database.collections.get<Transaction>('transactions').query(Q.sortBy('transaction_date', Q.desc)).observe(),
}))(DashboardContent);

export const DashboardScreen = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  return <EnhancedDashboardContent navigation={navigation} colors={colors} isDark={isDark} t={t} />;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNavbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navTitle: { fontSize: 20, fontWeight: '700', color: '#005a2b' },
  separator: { height: 1, backgroundColor: '#f0f0f0', width: '100%' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 18, fontWeight: '500', color: '#333', marginRight: 10 },
  secureBadge: { backgroundColor: '#e0efe5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  secureText: { fontSize: 10, fontWeight: '700', color: '#13702a' },

  assetCard: { backgroundColor: '#f4f6f5', marginHorizontal: 20, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eaeaeb' },
  assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eaeaeb', paddingBottom: 15, marginBottom: 15 },
  sectionSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#555' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#0a7a3a' },
  
  assetBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  netLiquidityLabel: { fontSize: 12, color: '#555', marginBottom: 5 },
  netLiquidityValue: { fontSize: 22, fontWeight: '500', color: '#111' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 20, backgroundColor: '#e8ecea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chartBar: { width: 14, borderRadius: 2 },

  assetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 10, fontWeight: '700', color: '#555', letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontSize: 16, fontWeight: '700' },

  actionRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 10 },
  syncBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef6f0', borderWidth: 1, borderColor: '#bad6c3', borderRadius: 8, paddingVertical: 12, gap: 8 },
  syncBtnText: { color: '#13702a', fontWeight: '600', fontSize: 14 },
  printBtn: { width: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eaeaeb', borderRadius: 8, backgroundColor: '#fff' },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 25, marginBottom: 15 },
  viewAllText: { fontSize: 11, fontWeight: '700', color: '#13702a', letterSpacing: 0.5 },

  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 10 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 4 },
  activitySub: { fontSize: 10, color: '#666', fontWeight: '600', letterSpacing: 0.5 },
  activityAmount: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  activityStatus: { fontSize: 9, color: '#666', fontWeight: '700' },

  marginCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 10, padding: 15, borderRadius: 10 },
  marginHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  marginText: { fontSize: 12, color: '#333', fontFamily: 'monospace' },
  marginPercent: { fontSize: 12, fontWeight: '700', color: '#13702a' },
  progressBarBg: { height: 6, backgroundColor: '#eaeaeb', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { width: '80%', height: '100%', backgroundColor: '#13702a' },

  fabContainer: { position: 'absolute', bottom: 20, right: 20, alignItems: 'center', gap: 15 },
  miniFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e4e7e6', justifyContent: 'center', alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: '#d1d6d3' },
});
