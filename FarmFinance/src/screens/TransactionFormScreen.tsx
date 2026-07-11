import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TransactionRepository } from '../data/repositories/TransactionRepository';
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
      await TransactionRepository.save(type, title, Number(amount), notes);
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
        <View style={[styles.toggleContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[
              styles.toggleBtn, 
              type === 'income' 
                ? { backgroundColor: colors.primary } 
                : { backgroundColor: 'transparent' }
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[typography.title, { fontSize: 16, color: type === 'income' ? colors.onPrimary : colors.text }]}>{t('income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn, 
              type === 'expense' 
                ? { backgroundColor: colors.error } 
                : { backgroundColor: 'transparent' }
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[typography.title, { fontSize: 16, color: type === 'expense' ? '#fff' : colors.text }]}>{t('expense')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, styles.label, { color: colors.textLight }]}>{t('title')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('placeholder_title')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[typography.caption, styles.label, { color: colors.textLight }]}>{t('amount')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder={t('placeholder_amount')}
          placeholderTextColor={colors.textLight}
        />

        <Text style={[typography.caption, styles.label, { color: colors.textLight }]}>{t('notes')}</Text>
        <TextInput
          style={[styles.input, { height: 120, backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder={t('placeholder_notes')}
          placeholderTextColor={colors.textLight}
        />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveTransaction}>
          <Text style={[typography.title, { color: colors.onPrimary }]}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 40 },
  toggleContainer: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.lg },
  toggleBtn: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: 'bold', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 16, padding: spacing.md, fontSize: 16, marginBottom: spacing.md, borderWidth: 1, elevation: 1 },
  saveBtn: { padding: spacing.lg, borderRadius: 16, alignItems: 'center', marginBottom: 40, elevation: 2 },
});
