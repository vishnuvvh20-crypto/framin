import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard } from 'react-native';
import { database } from '../db/database';
import { Transaction } from '../db/models/Transaction';
import { spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const CalculatorToolScreen = () => {
  const navigation = useNavigation();
  const { colors, typography } = useTheme();
  const { t } = useLanguage();

  // CALCULATOR STATE
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [operator, setOperator] = useState('*');
  const [calcNotes, setCalcNotes] = useState('');

  const calculateResult = () => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    if (operator === '+') return v1 + v2;
    if (operator === '-') return v1 - v2;
    if (operator === '*') return v1 * v2;
    if (operator === '/') return v2 !== 0 ? v1 / v2 : 0;
    return 0;
  };

  const handleSaveResult = async () => {
    const amount = calculateResult();
    if (amount <= 0) {
      Alert.alert(t('alert_calc_invalid'), t('alert_calc_invalid_msg'));
      return;
    }

    try {
      await database.write(async () => {
        await database.collections.get<Transaction>('transactions').create((t_db) => {
          t_db.title = `${t('calc_salary_payment')}${operator === '*' ? val2 + t('calc_workers_suffix') : t('calc_calculation')}`;
          t_db.notes = calcNotes; 
          t_db.amount = amount;
          t_db.type = 'expense';
          t_db.category = 'Salary/Wages';
          t_db.transactionDate = new Date();
          t_db.farmId = 'default_farm';
          t_db.userId = 'default_user';
        });
      });
      if (Keyboard && Keyboard.dismiss) Keyboard.dismiss();
      Alert.alert(t('alert_success'), t('alert_record_saved'), [
        { text: t('ok'), onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert(t('alert_error'), t('alert_save_error'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.calcBody}>
            <View style={styles.inputGroup}>
              <Text style={[typography.caption, { color: colors.textLight }]}>{t('calc_salary')} (₹)</Text>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]} 
                keyboardType="numeric" 
                value={val1} 
                onChangeText={setVal1} 
                placeholder="500" 
                placeholderTextColor={colors.textLight} 
              />
            </View>

            <View style={styles.operatorRow}>
              {['+', '-', '*', '/'].map((op) => (
                <TouchableOpacity 
                  key={op} 
                  onPress={() => setOperator(op)} 
                  style={[styles.opBtn, { borderColor: colors.border, backgroundColor: operator === op ? colors.primary : colors.inputBackground }]}
                >
                  <Text style={[styles.opBtnText, { color: operator === op ? colors.onPrimary : colors.text }]}>
                    {op === '*' ? '×' : op === '/' ? '÷' : op}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.caption, { color: colors.textLight }]}>{t('calc_workers')}</Text>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]} 
                keyboardType="numeric" 
                value={val2} 
                onChangeText={setVal2} 
                placeholder="10" 
                placeholderTextColor={colors.textLight} 
              />
            </View>

            <View style={[styles.resultCard, { backgroundColor: colors.primaryContainer }]}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.onPrimaryContainer, fontWeight: 'bold' }]}>{t('calc_total')}</Text>
                  <Text style={[styles.resultText, { color: colors.onPrimaryContainer }]}>₹ {calculateResult().toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={[styles.addBtnIcon, { backgroundColor: colors.primary }]} onPress={handleSaveResult}>
                 <Ionicons name="cloud-upload" size={26} color={colors.onPrimary} />
                 <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{t('add')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.caption, { color: colors.textLight }]}>{t('notes')}</Text>
              <TextInput 
                style={[styles.input, styles.notesInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]} 
                value={calcNotes} 
                onChangeText={setCalcNotes} 
                placeholder={t('placeholder_notes')} 
                placeholderTextColor={colors.textLight} 
                multiline={true} 
                numberOfLines={3} 
              />
            </View>
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveResult}>
               <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>{t('save')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.error }]} onPress={() => navigation.goBack()}>
               <Text style={[styles.cancelBtnText, { color: colors.error }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  calcBody: { gap: spacing.lg },
  inputGroup: { gap: 8 },
  input: { borderWidth: 1, padding: spacing.md, borderRadius: 16, fontSize: 18, elevation: 1 },
  notesInput: { fontSize: 16, height: 100, textAlignVertical: 'top' },
  operatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  opBtn: { flex: 0.22, height: 55, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  opBtnText: { fontSize: 26, fontWeight: 'bold' },
  resultCard: { padding: spacing.xl, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  addBtnIcon: { width: 70, height: 70, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 15, elevation: 4 },
  resultText: { fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  saveBtn: { padding: spacing.lg, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 3 },
  saveBtnText: { fontWeight: 'bold', fontSize: 18 },
  cancelBtn: { padding: spacing.lg, borderRadius: 16, alignItems: 'center', borderWidth: 1, marginTop: 5 },
  cancelBtnText: { fontWeight: 'bold', fontSize: 16 }
});
