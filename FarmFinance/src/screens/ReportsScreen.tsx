import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Share, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../db/database';
import { Transaction } from '../db/models/Transaction';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Q } from '@nozbe/watermelondb';

const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatShortCurrency = (val: number) => {
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toFixed(0)}`;
};

const ReportsContent = ({ transactions, navigation, t }: { transactions: Transaction[], navigation: any, t: any }) => {
  const { colors, isDark } = useTheme();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthBadgeText = `${monthNames[currentMonth]} ${currentYear}`;
  
  // 1. THIS MONTH
  const thisMonthTxns = transactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthIncome = thisMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const thisMonthExpense = thisMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const thisMonthNet = thisMonthIncome - thisMonthExpense;

  // 2. EXPENSE BREAKDOWN
  const expenseCategories: Record<string, number> = {};
  thisMonthTxns.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'General';
    expenseCategories[cat] = (expenseCategories[cat] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);
  const topCategories = sortedCategories.slice(0, 3);
  const legendColors = ['#13702a', '#8db799', '#e2a900'];

  // 2b. INCOME BREAKDOWN
  const incomeCategories: Record<string, number> = {};
  thisMonthTxns.filter(t => t.type === 'income').forEach(t => {
    const cat = t.category || 'General';
    incomeCategories[cat] = (incomeCategories[cat] || 0) + t.amount;
  });

  const sortedIncomeCategories = Object.entries(incomeCategories).sort((a, b) => b[1] - a[1]);
  const topIncomeCategories = sortedIncomeCategories.slice(0, 3);
  const legendColorsIncome = ['#0a521f', '#4c9b68', '#b3f2c5'];

  // 3. YEAR TO DATE (Past 6 months Revenue)
  const past6Months = [];
  for (let i = 5; i >= 0; i--) {
    let d = new Date(currentYear, currentMonth - i, 1);
    past6Months.push({ month: d.getMonth(), year: d.getFullYear(), label: monthNames[d.getMonth()].slice(0, 3) });
  }

  const ytdData = past6Months.map(m => {
    const txns = transactions.filter(t => {
      const d = new Date(t.transactionDate);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    const inc = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    return { label: m.label, value: inc }; 
  });

  const maxChartValue = Math.max(...ytdData.map(d => d.value), 1);

  const handleExport = async () => {
    const reportText = `FARMIN REPORT - ${monthBadgeText}\n\nTotal Revenue: ${formatCurrency(thisMonthIncome)}\nTotal Expenses: ${formatCurrency(thisMonthExpense)}\nNet Profit: ${formatCurrency(thisMonthNet)}\n\nTop Expenses:\n${topCategories.map(([c, a]) => `- ${c}: ${formatCurrency(a)}`).join('\n')}\n\nTop Income:\n${topIncomeCategories.map(([c, a]) => `- ${c}: ${formatCurrency(a)}`).join('\n')}`;
    
    try {
      const result = await Share.share({
        message: reportText,
        title: `Farmin Report ${monthBadgeText}`,
      });
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    }
  };

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

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('reports')}</Text>
        <TouchableOpacity onPress={handleExport}>
          <Ionicons name="download-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* MONTHLY SUMMARY CARD */}
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportHeader}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>THIS MONTH</Text>
            <View style={[styles.badge, { backgroundColor: isDark ? colors.border : '#e8ecea' }]}>
              <Text style={[styles.badgeText, { color: colors.textLight }]}>{monthBadgeText}</Text>
            </View>
          </View>

          <View style={styles.reportBody}>
            <View>
              <Text style={[styles.metricLabel, { color: colors.textLight }]}>Total Revenue</Text>
              <Text style={[styles.metricValue, { color: '#13702a' }]}>{formatCurrency(thisMonthIncome)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metricLabel, { color: colors.textLight }]}>Total Expenses</Text>
              <Text style={[styles.metricValue, { color: '#ba1a1a' }]}>{formatCurrency(thisMonthExpense)}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.reportFooter}>
            <Text style={[styles.metricLabel, { color: colors.textLight }]}>Net Profit</Text>
            <Text style={[styles.metricValue, { fontSize: 20, color: thisMonthNet >= 0 ? colors.text : '#ba1a1a' }]}>
              {formatCurrency(thisMonthNet)}
            </Text>
          </View>
        </View>

        {/* EXPENSE BREAKDOWN */}
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportHeader}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>{t('expense_breakdown').toUpperCase()}</Text>
          </View>

          <View style={styles.chartMockup}>
            <View style={styles.pieContainer}>
              <View style={[styles.pieCenter, { backgroundColor: colors.card }]}>
                <Text style={[styles.pieText, { color: colors.text }]}>{formatShortCurrency(thisMonthExpense)}</Text>
              </View>
            </View>
            
            <View style={styles.legendContainer}>
              {topCategories.length === 0 ? (
                <Text style={[styles.legendText, { color: colors.textLight }]}>No expenses this month.</Text>
              ) : (
                topCategories.map(([cat, amt], idx) => {
                  const pct = Math.round((amt / thisMonthExpense) * 100);
                  return (
                    <View style={styles.legendItem} key={cat}>
                      <View style={[styles.legendDot, { backgroundColor: legendColors[idx % legendColors.length] }]} />
                      <Text style={[styles.legendText, { color: colors.textLight }]} numberOfLines={1}>{cat} ({pct}%)</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* INCOME BREAKDOWN */}
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportHeader}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>INCOME BREAKDOWN</Text>
          </View>

          <View style={styles.chartMockup}>
            <View style={[styles.pieContainer, { borderColor: '#0a521f', borderTopColor: '#4c9b68', borderRightColor: '#b3f2c5' }]}>
              <View style={[styles.pieCenter, { backgroundColor: colors.card }]}>
                <Text style={[styles.pieText, { color: colors.text }]}>{formatShortCurrency(thisMonthIncome)}</Text>
              </View>
            </View>
            
            <View style={styles.legendContainer}>
              {topIncomeCategories.length === 0 ? (
                <Text style={[styles.legendText, { color: colors.textLight }]}>No income this month.</Text>
              ) : (
                topIncomeCategories.map(([cat, amt], idx) => {
                  const pct = Math.round((amt / thisMonthIncome) * 100);
                  return (
                    <View style={styles.legendItem} key={cat}>
                      <View style={[styles.legendDot, { backgroundColor: legendColorsIncome[idx % legendColorsIncome.length] }]} />
                      <Text style={[styles.legendText, { color: colors.textLight }]} numberOfLines={1}>{cat} ({pct}%)</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* YEAR TO DATE */}
        <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportHeader}>
            <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>{t('cash_flow').toUpperCase()}</Text>
          </View>

          <View style={styles.barChartContainer}>
            {ytdData.map((d, i) => {
              const heightPct = Math.max((d.value / maxChartValue) * 100, 2); // min 2% height
              return (
                <View style={styles.barColumn} key={i}>
                  <View style={[styles.barFill, { height: `${heightPct}%`, backgroundColor: '#13702a' }]} />
                  <Text style={styles.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const EnhancedReportsContent = withObservables([], () => ({
  transactions: database.collections.get<Transaction>('transactions').query(Q.sortBy('transaction_date', Q.desc)).observe(),
}))(ReportsContent);

export const ReportsScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  return <EnhancedReportsContent navigation={navigation} t={t} />;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNavbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navTitle: { fontSize: 20, fontWeight: '700', color: '#005a2b' },
  separator: { height: 1, backgroundColor: '#f0f0f0', width: '100%' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111' },

  reportCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eaeaeb', elevation: 1 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#555' },
  badge: { backgroundColor: '#e8ecea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#555' },

  reportBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 12, color: '#555', marginBottom: 5 },
  metricValue: { fontSize: 18, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: '#eaeaeb', marginVertical: 15 },
  
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  chartMockup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pieContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 15, borderColor: '#13702a', borderTopColor: '#8db799', borderRightColor: '#e2a900', justifyContent: 'center', alignItems: 'center' },
  pieCenter: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  pieText: { fontSize: 12, fontWeight: '700', color: '#333' },

  legendContainer: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#555', fontWeight: '500' },

  barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 10 },
  barColumn: { alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 10, color: '#777', marginTop: 8, fontWeight: '600' },
});
