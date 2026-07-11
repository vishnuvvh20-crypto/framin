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
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { spacing } from '../theme';

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
            <View style={[styles.secureBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.secureText, { color: colors.onPrimaryContainer }]}>SECURE</Text>
            </View>
          </View>
        </View>

        {/* ASSET OVERVIEW CARD */}
        <Card style={styles.assetCard} elevation={2}>
          <View style={[styles.assetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>ASSET OVERVIEW</Text>
            <View style={styles.liveBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
            </View>
          </View>

          <View style={styles.assetBody}>
            <View>
              <Text style={[styles.netLiquidityLabel, { color: colors.textLight }]}>Net Liquidity</Text>
              <Text style={[styles.netLiquidityValue, { color: colors.text }]}>
                ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.chartContainer, { backgroundColor: colors.inputBackground }]}>
              <View style={[styles.chartBar, { height: 8, backgroundColor: colors.primary + '80' }]} />
              <View style={[styles.chartBar, { height: 12, backgroundColor: colors.primary + 'B0' }]} />
              <View style={[styles.chartBar, { height: 10, backgroundColor: colors.primary + 'D0' }]} />
              <View style={[styles.chartBar, { height: 18, backgroundColor: colors.primary }]} />
              <View style={[styles.chartBar, { height: 6, backgroundColor: colors.primary + '80' }]} />
            </View>
          </View>

          <View style={styles.assetFooter}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('income').toUpperCase()}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.totalLabel, { color: colors.textLight }]}>{t('expense').toUpperCase()}</Text>
              <Text style={[styles.totalValue, { color: colors.error }]}>
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </Card>

        {/* BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.syncBtn, { backgroundColor: colors.primaryContainer }]} 
            onPress={handleSync} 
            disabled={isSyncing}
          >
            {isSyncing ? (
               <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
            ) : (
               <Ionicons name="cloud-upload" size={18} color={colors.onPrimaryContainer} />
            )}
            <Text style={[styles.syncBtnText, { color: colors.onPrimaryContainer }]}>
              {isSyncing ? 'Syncing...' : 'Push Sync'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.printBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => {
              if (Platform.OS === 'web') {
                window.print();
              } else {
                Alert.alert('Print', 'Please visit the Reports tab to generate reports.');
              }
            }}
          >
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
          <EmptyState 
            title="No transactions yet" 
            description="Start recording your farm income and expenses to track your balance."
            icon="cash-outline"
            actionText="Add Transaction"
            onActionPress={() => navigation.navigate('TransactionForm')}
          />
        ) : (
          recentTransactions.map(txn => {
            const isExpense = txn.type === 'expense';
            return (
              <Card 
                key={txn.id} 
                style={styles.activityCard}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: txn.id })}
                elevation={1}
              >
                <View style={styles.activityLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isExpense ? colors.error + '15' : colors.primary + '15' }]}>
                    <Ionicons 
                      name={getCategoryIcon(txn.title + ' ' + txn.category)} 
                      size={18} 
                      color={isExpense ? colors.error : colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{txn.title}</Text>
                    <Text style={[styles.activitySub, { color: colors.textLight }]}>
                      {formatDate(new Date(txn.transactionDate))}  •  {isExpense ? 'DEBIT' : 'CREDIT'}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                  <Text style={[styles.activityAmount, { color: isExpense ? colors.error : colors.primary }]}>
                    {isExpense ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.activityStatus, { color: colors.primary }]}>SUCCESS</Text>
                </View>
              </Card>
            );
          })
        )}

        {/* WEEKLY MARGIN */}
        <Card style={styles.marginCard} elevation={1}>
          <View style={styles.marginHeader}>
            <Text style={[styles.marginText, { color: colors.text }]}>Weekly Margin</Text>
            <Text style={[styles.marginPercent, { color: colors.primary }]}>+12%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.inputBackground }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary }]} />
          </View>
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.miniFab, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]} 
          onPress={() => navigation.navigate('CalculatorTool')}
        >
          <Ionicons name="calculator" size={20} color={colors.onPrimaryContainer} />
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
  navTitle: { fontSize: 20, fontWeight: '700' },
  separator: { height: 1, width: '100%' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', marginRight: 10 },
  secureBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  secureText: { fontSize: 10, fontWeight: '700' },

  assetCard: { marginHorizontal: 20, padding: 20, marginTop: 10 },
  assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15 },
  sectionSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveText: { fontSize: 10, fontWeight: '700' },
  
  assetBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  netLiquidityLabel: { fontSize: 12, marginBottom: 5 },
  netLiquidityValue: { fontSize: 24, fontWeight: '700' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 26, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chartBar: { width: 12, borderRadius: 2 },

  assetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontSize: 16, fontWeight: '700' },

  actionRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 10 },
  syncBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 8, elevation: 1 },
  syncBtnText: { fontWeight: '700', fontSize: 14 },
  printBtn: { width: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 25, marginBottom: 15 },
  viewAllText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  activityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, padding: 12, borderRadius: 16 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  activitySub: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  activityAmount: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  activityStatus: { fontSize: 9, fontWeight: '700' },

  marginCard: { marginHorizontal: 20, marginTop: 10, padding: 15 },
  marginHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  marginText: { fontSize: 12, fontFamily: 'monospace' },
  marginPercent: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { width: '82%', height: '100%' },

  fabContainer: { position: 'absolute', bottom: 20, right: 20, alignItems: 'center', gap: 15 },
  miniFab: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1 },
});
