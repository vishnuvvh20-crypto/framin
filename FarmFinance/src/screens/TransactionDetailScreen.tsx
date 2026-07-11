import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../db/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Transaction } from '../db/models/Transaction';
import { useLanguage } from '../context/LanguageContext';

// SAFE IMPORTS (Conditional)
let Print: any = null;
let Sharing: any = null;
try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
} catch (e) {
  console.log('Export modules not yet available.');
}

const TransactionDetailBase = ({ transaction, navigation }: { transaction: Transaction, navigation: any }) => {
  const { colors, typography } = useTheme();
  const { t } = useLanguage();

  if (!transaction) return null;

  const handleDownloadPDF = async () => {
    if (!Print || !Sharing) {
      Alert.alert(t('alert_module_not_available'), t('alert_pdf_export_msg'));
      return;
    }

    try {
      const isIncome = transaction.type === 'income';
    const amountStr = `${isIncome ? '+' : '-'}₹${transaction.amount.toFixed(2)}`;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 50px; }
            .title { color: ${colors.primary}; font-size: 32px; font-weight: bold; }
            .amount { font-size: 48px; margin: 20px 0; color: ${isIncome ? '#4CAF50' : '#F44336'}; }
            .details { border-top: 2px solid #eee; padding-top: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 18px; }
            .label { font-weight: bold; color: #666; }
            .footer { margin-top: 100px; text-align: center; font-size: 14px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${t('pdf_receipt_title')}</div>
            <div>${t('pdf_receipt_subtitle')}</div>
            <div class="amount">${amountStr}</div>
          </div>
          <div class="details">
            <div class="row"><div class="label">${t('pdf_item')}</div><div>${transaction.title || t('untitled')}</div></div>
            <div class="row"><div class="label">${t('pdf_txn_id')}</div><div>${transaction.id}</div></div>
            <div class="row"><div class="label">${t('pdf_date')}</div><div>${transaction.transactionDate.toDateString()}</div></div>
            <div class="row"><div class="label">${t('pdf_status')}</div><div>${transaction.type.toUpperCase()}</div></div>
            <div class="row"><div class="label">${t('pdf_notes')}</div><div>${transaction.notes || 'N/A'}</div></div>
          </div>
          <div class="footer">${t('pdf_footer')}</div>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert(t('alert_error'), t('alert_pdf_error'));
    }
  };

  const handleDelete = async () => {
    const deleteAction = async () => {
      try {
        await database.write(async () => { 
          await transaction.destroyPermanently();
        });
        navigation.goBack();
      } catch (e) {
        Alert.alert(t('alert_error'), t('alert_delete_error'));
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('alert_confirm_removal'));
      if (confirmed) {
        deleteAction();
      }
    } else {
      Alert.alert(t('delete'), t('alert_confirm_removal'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: deleteAction }
      ]);
    }
  };

  const isIncome = transaction.type === 'income';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
           <View style={[styles.statusBadge, { backgroundColor: isIncome ? colors.success : colors.error }]}>
             <Text style={styles.statusText}>{transaction.type.toUpperCase()}</Text>
           </View>
           <Text style={[typography.header, { marginTop: 15, fontSize: 32, textAlign: 'center' }]}>
             {transaction.title || t('untitled_entry')}
           </Text>
           <Text style={[typography.header, { marginTop: 5, fontSize: 24, color: isIncome ? colors.success : colors.error }]}>
             {isIncome ? '+' : '-'}₹{transaction.amount.toFixed(2)}
           </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <View style={styles.rowContent}>
            <Text style={[typography.caption, { color: colors.textLight }]}>{t('date')}</Text>
            <Text style={[typography.body, { fontWeight: '600' }]}>{transaction.transactionDate.toDateString()}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <View style={styles.rowContent}>
            <Text style={[typography.caption, { color: colors.textLight }]}>{t('notes')}</Text>
            <Text style={typography.body}>{transaction.notes || 'No extra notes.'}</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.md }}>
        <TouchableOpacity 
          style={[styles.downloadBtn, { backgroundColor: colors.primary, opacity: (Print && Sharing) ? 1 : 0.5 }]} 
          onPress={handleDownloadPDF}
        >
          <Ionicons name="cloud-download-outline" size={24} color="#fff" />
          <Text style={styles.downloadText}>{t('download_pdf')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.deleteBtn, { borderColor: colors.error, marginTop: spacing.md }]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: 'bold', marginLeft: 8 }}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const TransactionDetailScreen = withObservables(['route'], ({ route }: any) => ({
  transaction: database.collections.get<Transaction>('transactions').findAndObserve(route.params.transactionId),
}))(TransactionDetailBase);

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: spacing.md, borderRadius: 16, padding: spacing.xl, elevation: 2 },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  rowContent: { marginLeft: spacing.lg },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.md, opacity: 0.5 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, elevation: 3 },
  downloadText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1 }
});
