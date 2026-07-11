import { Calendar } from 'react-native-calendars';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../db/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Task } from '../db/models/Task';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

// REMOVED expo-av to prevent Android native crashes previously, now re-introduced as requested
import { Video, ResizeMode } from 'expo-av';
import { getWeatherVideoUrl } from '../utils/weatherVideos';

let Location: any = null;
try {
  Location = require('expo-location');
} catch (e) {}

const CACHE_KEY = '@farmcare_weather_cache';

const CalendarBase = ({ tasks }: { tasks: Task[] }) => {
  const { colors, typography, isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [locationName, setLocationName] = useState(t('calendar_my_farm'));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const loadCache = async () => {
      const saved = await AsyncStorage.getItem(CACHE_KEY);
      if (saved) {
        const { data, name } = JSON.parse(saved);
        setWeatherData(data);
        setLocationName(name);
      }
    };
    loadCache();
  }, []);

  const fetchWeather = async () => {
    if (!Location) {
      Alert.alert(t('alert_module_unavailable'), t('alert_weather_gps'));
      return;
    }
    
    setWeatherModalVisible(true);
    if (!weatherData) setIsWeatherLoading(true);
    setSelectedDayIndex(0);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsWeatherLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      const weatherPromise = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`);
      const geoPromise = Location.reverseGeocodeAsync({ latitude, longitude });

      const [weatherResp, geo] = await Promise.all([weatherPromise, geoPromise]);
      const data = await weatherResp.json();
      
      const newName = geo.length > 0 ? `${geo[0].city || geo[0].name}, ${geo[0].region}` : t('calendar_my_farm');
      
      setWeatherData(data);
      setLocationName(newName);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, name: newName }));

    } catch (e) { 
      if (!weatherData) Alert.alert(t('alert_connection_slow'), t('alert_weather_error')); 
    } finally { setIsWeatherLoading(false); }
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'partly-sunny';
    if (code <= 48) return 'cloudy';
    if (code <= 67) return 'rainy';
    return 'thunderstorm';
  };

  const getWeatherText = (code: number) => {
    if (code === 0) return t('weather_sunny');
    if (code <= 3) return t('weather_mostly_sunny');
    if (code <= 48) return t('weather_cloudy');
    if (code <= 67) return t('weather_rainy');
    return t('weather_stormy');
  };

  const renderHourlyScroller = () => {
    if (!weatherData) return null;
    const startIndex = selectedDayIndex * 24;
    const hourlyTemps = weatherData.hourly.temperature_2m.slice(startIndex, startIndex + 24);
    const hourlyCodes = weatherData.hourly.weather_code.slice(startIndex, startIndex + 24);
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyContainer}>
        {hourlyTemps.map((temp: number, i: number) => {
          const hour = i;
          const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
          return (
            <View key={i} style={styles.hourCol}>
              <Text style={[styles.hourTemp, { color: colors.text }]}>{Math.round(temp)}°</Text>
              <View style={[styles.graphBar, { height: (temp / 50) * 100, backgroundColor: colors.primary + '30' }]} />
              <Ionicons name={getWeatherIcon(hourlyCodes[i]) as any} size={22} color="#FFA000" style={{ marginVertical: 8 }} />
              <Text style={[styles.hourLabel, { color: colors.textLight }]}>{displayHour}</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const markedDates: any = {};
  tasks.forEach(t => { markedDates[t.dueDate.toISOString().split('T')[0]] = { marked: true, dotColor: colors.primary }; });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: colors.primary };
  const dailyTasks = tasks.filter(t => t.dueDate.toISOString().split('T')[0] === selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <Calendar
          theme={{
            backgroundColor: colors.card, calendarBackground: colors.card, textSectionTitleColor: colors.textLight,
            selectedDayBackgroundColor: colors.primary, selectedDayTextColor: '#ffffff', todayTextColor: colors.primary,
            dayTextColor: colors.text, textDisabledColor: isDark ? '#444' : '#d9e1e8', dotColor: colors.primary,
            arrowColor: colors.primary, monthTextColor: colors.text, textDayFontWeight: '300', textMonthFontWeight: 'bold',
          }}
          current={selectedDate} onDayPress={day => setSelectedDate(day.dateString)} markedDates={markedDates}
        />
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
              <Text style={[typography.title, { marginBottom: 0 }]}>{new Date(selectedDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
              <TouchableOpacity 
                style={[styles.addInlineBtn, { backgroundColor: colors.primary }]} 
                onPress={() => navigation.navigate('TaskForm', { selectedDate })}
              >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addInlineText}>{t('calendar_add_schedule')}</Text>
              </TouchableOpacity>
          </View>

          {dailyTasks.map(task => (
            <TouchableOpacity key={task.id} onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })} style={[styles.eventCard, { backgroundColor: colors.card }]}>
              <View style={[styles.timeStrip, { backgroundColor: colors.primary }]} />
              <View style={styles.eventInfo}>
                <Text style={[typography.body, { fontWeight: '600' }]}>{task.title}</Text>
                <Text style={[typography.caption, { color: colors.textLight }]}>⏰ {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
          {dailyTasks.length === 0 && <View style={[styles.eventCard, { backgroundColor: colors.card, opacity: 0.5 }]}><Text style={typography.caption}>{t('calendar_no_tasks')}</Text></View>}
        </View>
      </ScrollView>

      <Modal visible={weatherModalVisible} animationType="fade" transparent={false}>
        <View style={[styles.weatherContainer, { backgroundColor: colors.background }]}>
          <View style={styles.weatherHeader}>
            <TouchableOpacity onPress={() => setWeatherModalVisible(false)} style={styles.closeBtn}><Ionicons name="close-circle" size={32} color={colors.text} /></TouchableOpacity>
            <Text style={[typography.title, { flex: 1, textAlign: 'center' }]}>{locationName}</Text>
            <View style={{ width: 40 }} />
          </View>

          {isWeatherLoading && !weatherData ? (
            <View style={styles.loadingCenter}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 20, color: colors.textLight }}>{t('calendar_initializing_weather')}</Text></View>
          ) : weatherData ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
              <View style={[styles.gradientHeader, { backgroundColor: '#000' }]}>
                {weatherData && weatherData.daily && weatherData.daily.weather_code[selectedDayIndex] !== undefined && (
                  <Video
                    source={{ uri: getWeatherVideoUrl(weatherData.daily.weather_code[selectedDayIndex]) }}
                    rate={1.0}
                    volume={0.0}
                    isMuted={true}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    style={StyleSheet.absoluteFill}
                  />
                )}
                {/* Fallback dark overlay to ensure text remains readable over video */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                
                 <View style={styles.headerContent}>
                    <Text style={[typography.caption, { color: '#fff', marginBottom: 5, fontWeight: 'bold' }]}>
                       {new Date(weatherData.daily.time[selectedDayIndex]).toDateString()}
                    </Text>
                    <View style={styles.currentMain}>
                       <View style={styles.tempGroup}>
                          <Text style={[styles.bigTemp, { color: '#fff' }]}>
                            {Math.round(selectedDayIndex === 0 && weatherData.current ? weatherData.current.temperature_2m : weatherData.daily.temperature_2m_max[selectedDayIndex])}°C
                          </Text>
                          <Text style={[typography.body, { color: '#fff', fontWeight: 'bold' }]}>
                            {t('weather_high')}: {Math.round(weatherData.daily.temperature_2m_max[selectedDayIndex])}° • {t('weather_low')}: {Math.round(weatherData.daily.temperature_2m_min[selectedDayIndex])}°
                          </Text>
                       </View>
                       <View style={{ alignItems: 'center' }}>
                          <Ionicons name={getWeatherIcon(weatherData.daily.weather_code[selectedDayIndex]) as any} size={85} color="#fff" />
                          <Text style={[typography.body, { color: '#fff', fontWeight: 'bold' }]}>{getWeatherText(weatherData.daily.weather_code[selectedDayIndex])}</Text>
                       </View>
                    </View>
                 </View>
              </View>

              <Text style={[typography.title, styles.sectionTitle]}>{t('weather_hourly_trend')} ({new Date(weatherData.daily.time[selectedDayIndex]).toLocaleDateString([], { weekday: 'long' })})</Text>
              {renderHourlyScroller()}

              <View style={[styles.summaryCard, { backgroundColor: colors.primaryContainer }]}>
                 <Ionicons name="umbrella" size={24} color={colors.onPrimaryContainer} />
                 <Text style={[typography.body, { marginLeft: 15, color: colors.onPrimaryContainer, fontWeight: '600' }]}>
                    {weatherData.daily.precipitation_probability_max[selectedDayIndex]}% {t('weather_chance_rain')}
                 </Text>
              </View>

              <Text style={[typography.title, styles.sectionTitle]}>{t('weather_forecast_7_day')}</Text>
              <View style={[styles.listWrapper, { backgroundColor: colors.card }]}>
                {weatherData.daily.time.map((day: any, i: number) => (
                  <TouchableOpacity 
                    key={day} 
                    onPress={() => setSelectedDayIndex(i)}
                    style={[
                      styles.listRow, { borderBottomColor: colors.border, borderBottomWidth: i === 6 ? 0 : 1 },
                      selectedDayIndex === i && { backgroundColor: colors.primaryContainer }
                    ]}
                  >
                    <Text style={[styles.dayText, { color: selectedDayIndex === i ? colors.onPrimaryContainer : colors.text, fontWeight: selectedDayIndex === i ? 'bold' : '600' }]}>{new Date(day).toLocaleString('default', { weekday: 'short' })}</Text>
                    <View style={styles.iconCell}>
                       <Ionicons name={getWeatherIcon(weatherData.daily.weather_code[i]) as any} size={22} color="#FFA000" />
                       {weatherData.daily.precipitation_probability_max[i] > 20 && <Text style={styles.rainChance}>{weatherData.daily.precipitation_probability_max[i]}%</Text>}
                    </View>
                    <View style={styles.tempRange}>
                       <Text style={[styles.tempMax, { color: colors.text }]}>{Math.round(weatherData.daily.temperature_2m_max[i])}°</Text>
                       <Text style={[styles.tempMin, { color: colors.textLight }]}>{Math.round(weatherData.daily.temperature_2m_min[i])}°</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.weatherFab, { backgroundColor: colors.card, borderColor: colors.primary, marginBottom: spacing.md }]} 
          onPress={fetchWeather}
        >
          <Ionicons name="partly-sunny" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.addFab, { backgroundColor: colors.primary }]} 
          onPress={() => navigation.navigate('TaskForm', { selectedDate })}
        >
          <Ionicons name="add" size={32} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CalendarScreen = withObservables([], () => ({ tasks: database.collections.get<Task>('tasks').query(Q.sortBy('due_date', Q.asc)), }))(CalendarBase);

const styles = StyleSheet.create({
  container: { flex: 1 },
  detailsContainer: { padding: spacing.md, paddingBottom: 100 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addInlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 2 },
  addInlineText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 5 },
  eventCard: { padding: spacing.md, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, elevation: 1, overflow: 'hidden' },
  timeStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  eventInfo: { flex: 1, marginLeft: 10 },
  weatherContainer: { flex: 1 },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  closeBtn: { padding: 8 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gradientHeader: { height: 220, marginHorizontal: spacing.md, borderRadius: 24, overflow: 'hidden', elevation: 10 },
  headerContent: { flex: 1, padding: 25, justifyContent: 'center' },
  currentMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tempGroup: { flex: 1 },
  bigTemp: { fontSize: 75, fontWeight: '200' },
  sectionTitle: { paddingHorizontal: spacing.md, marginTop: 25, marginBottom: 15 },
  hourlyContainer: { paddingLeft: spacing.md },
  hourCol: { width: 75, alignItems: 'center', justifyContent: 'flex-end', height: 180 },
  hourTemp: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  graphBar: { width: 40, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  hourLabel: { fontSize: 11, marginBottom: 10 },
  summaryCard: { margin: spacing.md, padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  listWrapper: { marginHorizontal: spacing.md, borderRadius: 16, padding: 5, elevation: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15 },
  dayText: { width: 60, fontSize: 16, fontWeight: '600' },
  iconCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rainChance: { fontSize: 10, color: '#29B6F6', fontWeight: 'bold', marginLeft: 5 },
  tempRange: { flexDirection: 'row', width: 80, justifyContent: 'flex-end' },
  tempMax: { fontSize: 16, fontWeight: 'bold', marginRight: 15 },
  tempMin: { fontSize: 16 },
  fabContainer: { position: 'absolute', bottom: 30, right: 30, alignItems: 'center' },
  weatherFab: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1 },
  addFab: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }
});
