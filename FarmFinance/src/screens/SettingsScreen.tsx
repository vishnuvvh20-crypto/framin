import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const languages = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { id: 'te', name: 'Telugu', native: 'తెలుగు' },
];

export const SettingsScreen = () => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark, toggleDarkMode, colors, typography } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const initSettings = async () => {
      // Check biometric hardware
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setHasHardware(compatible);

      // Fetch saved biometric preference
      const savedBio = await AsyncStorage.getItem('biometric_login_enabled');
      setBiometricEnabled(savedBio === 'true');

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };
    initSettings();
  }, []);

  const toggleBiometrics = async (value: boolean) => {
    if (!hasHardware) {
      Alert.alert(t('alert_hardware_missing'), t('alert_hardware_missing_msg'));
      return;
    }

    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('alert_biometric_enrollment'),
      });
      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem('biometric_login_enabled', 'true');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('biometric_login_enabled', 'false');
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('alert_sign_out_confirm'), [
      { text: t('cancel'), style: "cancel" },
      { text: t('logout'), style: "destructive", onPress: async () => { 
          await supabase.auth.signOut(); 
          await AsyncStorage.removeItem('farmin_guest_mode');
      } }
    ]);
  };

  const getIdentity = () => {
    if (!session) return t('settings_guest_user');
    const user = session.user;
    return user.phone || user.email || t('settings_farmer_account');
  };

  if (isLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Ionicons name="person-circle" size={80} color={colors.primary} />
        <Text style={[typography.header, { marginTop: spacing.sm }]}>{getIdentity()}</Text>
        <Text style={[typography.caption, { fontWeight: 'bold', color: colors.primary, marginTop: spacing.xs }]}>
          {session ? t('settings_premium_identity') : t('settings_guest_identity')}
        </Text>
      </View>

      <Text style={[typography.title, styles.sectionTitle]}>{t('app_preferences')}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={[styles.row, { paddingBottom: 0, justifyContent: 'flex-start' }]}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={[typography.body, { fontWeight: 'bold', marginLeft: 15 }]}>{t('language')}</Text>
        </View>

        <View style={styles.langList}>
          {languages.map((lang) => (
            <TouchableOpacity 
              key={lang.id} 
              style={styles.langItem}
              onPress={() => setLanguage(lang.id as any)}
            >
              <View style={[styles.radio, { borderColor: colors.primary }]}>
                {language === lang.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={[typography.body, { fontSize: 16 }]}>{lang.name}</Text>
                <Text style={[typography.caption, { color: colors.textLight }]}>{lang.native}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.row}>
          <Text style={[typography.body]}>{t('settings_biometric_login')}</Text>
          <Switch 
            value={biometricEnabled} 
            onValueChange={toggleBiometrics} 
            trackColor={{ false: colors.border, true: colors.primary }}
            disabled={!hasHardware}
          />
        </View>
        {!hasHardware && (
          <Text style={styles.subHint}>{t('settings_hardware_not_available')}</Text>
        )}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Text style={[typography.body]}>{t('dark_mode')}</Text>
          <Switch value={isDark} onValueChange={toggleDarkMode} trackColor={{ false: colors.border, true: colors.primary }} />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutBtn, { backgroundColor: colors.error }]} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>{session ? t('logout') : t('settings_exit_guest_mode')}</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1 },
  sectionTitle: { paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.md, borderRadius: 16, elevation: 2, paddingVertical: 10 },
  langList: { paddingHorizontal: spacing.md, marginVertical: 10 },
  langItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, padding: 5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  divider: { height: 1, marginHorizontal: spacing.md },
  logoutBtn: { margin: spacing.xl, padding: spacing.md, borderRadius: 12, alignItems: 'center', elevation: 2 },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subHint: { color: '#94a3b8', fontSize: 12, paddingHorizontal: spacing.md, marginBottom: 10, textAlign: 'right' }
});
