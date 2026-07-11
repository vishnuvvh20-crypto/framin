import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLanguage } from '../context/LanguageContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <LinearGradient
      colors={['#e8f5e9', '#ffffff']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.centerFixed}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Farmin</Text>
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.fromText}>{t('splash_from')}</Text>
          <Text style={styles.vishnuText}>Vishnu</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  centerFixed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#2e7d32',
    letterSpacing: 1.5,
  },
  bottomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fromText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
    letterSpacing: 1,
  },
  vishnuText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4caf50',
    letterSpacing: 1.2,
  },
});
