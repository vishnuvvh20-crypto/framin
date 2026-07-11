import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase, isCloudReady } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export const AuthScreen = ({ onAuthSuccess }: any) => {
  const [showLogin, setShowLogin] = useState(false);
  const [identity, setIdentity] = useState(''); 
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const { colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const checkBioPref = async () => {
      const enabled = await AsyncStorage.getItem('biometric_login_enabled');
      const supported = await LocalAuthentication.hasHardwareAsync();
      setIsBioEnabled(enabled === 'true' && supported);
    };
    checkBioPref();
  }, []);

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth_quick_access'),
      fallbackLabel: t('auth_use_password'),
    });

    if (result.success) {
      // In a real app, you might use a secure token stored in Keychain.
      // For this implementation, we pull the last session or trigger a bypass.
      const isGuest = await AsyncStorage.getItem('farmin_guest_mode');
      if (isGuest === 'true' && onAuthSuccess) {
          onAuthSuccess({ user: { id: 'guest' } });
      } else {
          // If they were logged in with Supabase, it usually auto-logs them in.
          // This button ensures they unlock the SCREEN with biometrics.
          const { data: { session } } = await supabase.auth.getSession();
          if (session && onAuthSuccess) {
              onAuthSuccess(session);
          } else {
              Alert.alert(t('auth_session_expired'), t('auth_session_expired_msg'));
          }
      }
    }
  };

  const handleSendOtp = async () => {
    if (!identity) {
        Alert.alert(t('auth_required'), t('auth_enter_identity'));
        return;
    }

    if (!isCloudReady) {
        // Local fallback if no cloud setup
        setLoading(true);
        try {
            await AsyncStorage.setItem('farmin_guest_mode', 'false');
            await AsyncStorage.setItem('farmin_local_user_id', identity);
            if (onAuthSuccess) onAuthSuccess({ user: { id: identity, phone: identity } });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
        return;
    }

    setLoading(true);
    try {
      const isEmail = identity.includes('@');
      let error;
      
      if (isEmail) {
        const res = await supabase.auth.signInWithOtp({ email: identity });
        error = res.error;
      } else {
        const res = await supabase.auth.signInWithOtp({ phone: identity });
        error = res.error;
      }

      if (error) throw error;
      
      setIsOtpSent(true);
      Alert.alert(t('auth_otp_sent'), t('auth_otp_sent_msg'));
    } catch (error: any) {
      Alert.alert(t('auth_error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
        Alert.alert(t('auth_required'), t('auth_enter_otp'));
        return;
    }

    setLoading(true);
    try {
      const isEmail = identity.includes('@');
      const { data, error } = await supabase.auth.verifyOtp({
        email: isEmail ? identity : undefined,
        phone: !isEmail ? identity : undefined,
        token: otpCode,
        type: isEmail ? 'magiclink' : 'sms'
      } as any);

      if (error) throw error;
      
      if (onAuthSuccess && data.session) {
        onAuthSuccess(data.session);
      }
    } catch (error: any) {
      Alert.alert(t('auth_verify_error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const startGuestMode = async () => {
    await AsyncStorage.setItem('farmin_guest_mode', 'true');
    if (onAuthSuccess) onAuthSuccess({ user: { id: 'guest' } });
  };

  if (!showLogin) {
    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
             <View style={styles.introContent}>
                 <Image source={require('../../assets/icon.png')} style={styles.introLogo} />
                 <Text style={styles.introTitle}>{t('auth_title')}</Text>
                 <Text style={styles.introText}>{t('auth_subtitle')}</Text>
                 
                 <TouchableOpacity style={styles.getStartedBtn} onPress={() => setShowLogin(true)}>
                     <Text style={[styles.getStartedText, { color: colors.primary }]}>{t('auth_get_started')}</Text>
                     <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                 </TouchableOpacity>

                 {isBioEnabled && (
                     <TouchableOpacity style={styles.bioQuickBtn} onPress={handleBiometricLogin}>
                         <Ionicons name="finger-print-outline" size={32} color="#fff" />
                         <Text style={styles.bioQuickText}>{t('auth_quick_entry')}</Text>
                     </TouchableOpacity>
                 )}

                 <Text style={styles.introFooter}>{t('auth_hardware_sync')}</Text>
             </View>
        </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowLogin(false)}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
            <View style={styles.logoCircle}>
                <Image source={require('../../assets/icon.png')} style={styles.logo} />
            </View>
            <Text style={styles.brandTitle}>{t('auth_cloud_gateway')}</Text>
            <Text style={styles.brandSub}>{t('auth_perm_storage')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>{isOtpSent ? t('auth_enter_otp_code') : t('auth_login_title')}</Text>
            
            <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.textLight} />
                <TextInput 
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('auth_identity_placeholder')}
                    placeholderTextColor={colors.textLight}
                    value={identity}
                    onChangeText={setIdentity}
                    autoCapitalize="none"
                    editable={!isOtpSent}
                />
            </View>

            {isOtpSent && (
                <View style={[styles.inputGroup, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <Ionicons name="keypad-outline" size={20} color={colors.textLight} />
                    <TextInput 
                        style={[styles.input, { color: colors.text }]}
                        placeholder={t('auth_otp_placeholder')}
                        placeholderTextColor={colors.textLight}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                    />
                </View>
            )}

            <TouchableOpacity 
                style={[styles.mainBtn, { backgroundColor: colors.primary }]} 
                onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
                disabled={loading}
            >
                <Text style={styles.btnText}>{loading ? t('auth_processing') : (isOtpSent ? t('auth_verify_login') : t('auth_send_otp'))}</Text>
            </TouchableOpacity>

            {isOtpSent && (
                <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.toggleBtn}>
                    <Text style={[styles.toggleText, { color: colors.textLight }]}>{t('auth_change_identity')}</Text>
                </TouchableOpacity>
            )}

            <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textLight }]}>{t('auth_or')}</Text>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity style={styles.guestBtn} onPress={startGuestMode}>
                <Text style={[styles.guestBtnText, { color: colors.textLight }]}>{t('auth_local_storage')}</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  introContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  introLogo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', marginBottom: 20 },
  introTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  introText: { fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 28, marginBottom: 40 },
  getStartedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 30, elevation: 10 },
  getStartedText: { fontWeight: 'bold', fontSize: 18, marginRight: 10 },
  bioQuickBtn: { marginTop: 30, alignItems: 'center', opacity: 0.9 },
  bioQuickText: { color: '#fff', fontWeight: 'bold', marginTop: 8, fontSize: 14 },
  introFooter: { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', padding: 15, elevation: 10 },
  logo: { width: '100%', height: '100%', resizeMode: 'contain' },
  brandTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 15 },
  brandSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, elevation: 5 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 25, textAlign: 'center' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 60, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  mainBtn: { height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  toggleBtn: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#64748b', fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 10, color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  guestBtn: { alignItems: 'center', padding: 15 },
  guestBtnText: { color: '#64748b', fontWeight: '600', fontSize: 12, textDecorationLine: 'underline' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 }
});
