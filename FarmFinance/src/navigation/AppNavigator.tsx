import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { enableScreens } from 'react-native-screens';
import { View, Image, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

enableScreens();

import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { TransactionFormScreen } from '../screens/TransactionFormScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CalculatorToolScreen } from '../screens/CalculatorToolScreen';
import { AIScreen } from '../screens/AIScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { syncWithSupabase } from '../sync';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppBrand = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity 
      style={styles.brandContainer} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Settings' as never)}
    >
      <Image 
        source={require('../../assets/icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.brandText, { color: '#fff' }]}>Farmin</Text>
    </TouchableOpacity>
  );
};

const HeaderCalendar = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity 
      style={styles.headerRightBtn}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Calendar' as never)}
    >
      <Ionicons name="calendar-outline" size={28} color="#fff" />
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
        switch (route.name) {
          case 'Dashboard': iconName = isFocused ? 'grid' : 'grid-outline'; break;
          case 'Transactions': iconName = isFocused ? 'receipt' : 'receipt-outline'; break;
          case 'Notes': iconName = isFocused ? 'create' : 'create-outline'; break;
          case 'Reports': iconName = isFocused ? 'bar-chart' : 'bar-chart-outline'; break;
          case 'Research': iconName = isFocused ? 'hardware-chip' : 'hardware-chip-outline'; break;
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabItem, isFocused && { backgroundColor: isDark ? '#1a3b2b' : '#b3f2c5' }]}
          >
            <Ionicons name={iconName} size={22} color={isFocused ? colors.primary : colors.textLight} />
            <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textLight }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabs = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t('dashboard') }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: t('transactions') }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ tabBarLabel: t('notes') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: t('reports') }} />
      <Tab.Screen name="Research" component={AIScreen} options={{ tabBarLabel: t('ai_assistant') }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Check for real session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for guest bypass
      const isGuest = await AsyncStorage.getItem('farmin_guest_mode');
      
      if (session) {
        setSession(session);
        syncWithSupabase().catch(console.error);
      } else if (isGuest === 'true') {
        // Set a 'fake' session object to trigger dashboard entrance
        setSession({ user: { id: 'guest' } });
      }
      
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) syncWithSupabase().catch(console.error);
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      };

  if (splashVisible) {
    return <SplashScreen onFinish={() => setSplashVisible(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: { backgroundColor: colors.primary }, 
          headerTintColor: '#fff',
          animation: 'slide_from_right',
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" options={{ headerShown: false }}>
            {(props) => <AuthScreen {...props} onAuthSuccess={setSession} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') }} />
            <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: t('calendar') }} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Schedule Details' }} />
            <Stack.Screen name="TransactionForm" component={TransactionFormScreen} options={{ title: t('add_transaction') }} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: t('transactions') }} />
            <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ title: 'Journal Entry' }} />
            <Stack.Screen name="CalculatorTool" component={CalculatorToolScreen} options={{ title: t('calc_title') }} />
            <Stack.Screen name="AIScreen" component={AIScreen} options={{ title: 'Farmin Research Engine' }} />
            <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ title: 'Schedule Field Task' }} />
            <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: t('inventory') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 15, paddingRight: 10 },
  headerRightBtn: { marginRight: 15, padding: 5 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  brandText: { fontSize: 22, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 60,
  },
  tabItemFocused: {
    backgroundColor: '#b3f2c5', // Light green highlight for active tab
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  }
});
