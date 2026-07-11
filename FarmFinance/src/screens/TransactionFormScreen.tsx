import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { database } from '../db/database';
import { spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const TransactionFormScreen = () => {
  const navigation = useNavigation();
  const { colors, typography } = useTheme();
  const { t } = useLanguage();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const saveTransaction = async () => {
    if (!title.trim() || !amount || isNaN(Number(amount))) {
      Alert.alert(t('alert_caution'), t('alert_invalid_amount'));
      return;
    }

    try {
      // 1. Save to local WatermelonDB
      await database.write(async () => {
        await database.collections.get('transactions').create((t: any) => {
          t.farmId = 'main-farm';
          t.userId = 'user-1';
          t.type = type;
          t.title = title;
          t.amount = Number(amount);
          t.notes = notes;
          t.transactionDate = new Date();
        });
      });

      // 2. Save to our new MySQL backend
      try {
        const endpoint = type === 'income' ? '/api/income' : '/api/expense';
        
        // We use the exact local IP address so it works on physical phones on Wi-Fi and android emulators
        const serverUrl = 'http://10.162.189.185:3000'; 
        
        const payload: any = {
          amount: Number(amount),
          description: notes,
          date: new Date().toISOString()
        };

        // Note: the tables have slightly different schema (source vs category)
        if (type === 'income') {
          payload.source = title;
        } else {
          payload.category = title;
        }

        await fetch(`${serverUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (backendError) {
         console.log('Failed to save to MySQL backend. It might be off:', backendError);
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert(t('alert_error'), t('alert_save_error'));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, { borderColor: colors.border, backgroundColor: colors.card }, type === 'income' && { backgroundColor: colors.success, borderColor: colors.success }]}
            onPress={() => setType('income')}
          >
            <Text style={[typography.title, { color: type === 'income' ? '#fff' : colors.text }]}>{t('income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, { borderColor: colors.border, backgroundColor: colors.card }, type === 'expense' && { backgroundColor: colors.error, borderColor: colors.error }]}
            onPress={() => setType('expense')}
          >
            <Text style={[typography.title, { color: type === 'expense' ? '#fff' : colors.text }]}>{t('expense')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, styles.label]}>{t('title')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('placeholder_title')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[typography.caption, styles.label]}>{t('amount')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder={t('placeholder_amount')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[typography.caption, styles.label]}>{t('notes')}</Text>
        <TextInput
          style={[styles.input, { height: 100, backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder={t('placeholder_notes')}
          placeholderTextColor={colors.textLight}
        />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveTransaction}>
          <Text style={[typography.title, { color: '#fff' }]}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 40 },
  toggleContainer: { flexDirection: 'row', marginBottom: spacing.lg },
  toggleBtn: { flex: 1, padding: spacing.md, borderWidth: 1, alignItems: 'center' },
  label: { fontWeight: 'bold', marginBottom: spacing.xs, textTransform: 'uppercase' },
  input: { borderRadius: 8, padding: spacing.md, fontSize: 16, marginBottom: spacing.md, borderWidth: 1 },
  saveBtn: { padding: spacing.lg, borderRadius: 8, alignItems: 'center', marginBottom: 40 },
});
