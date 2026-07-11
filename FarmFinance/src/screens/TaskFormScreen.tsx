import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Switch, KeyboardAvoidingView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../db/database';
import { Task } from '../db/models/Task';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

// Setup notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const TaskFormScreen = () => {
    const { colors, typography } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation();
    const route = useRoute<any>();
    
    // Default to the date selected in the calendar
    const initialDate = route.params?.selectedDate ? new Date(route.params.selectedDate) : new Date();
    
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(initialDate);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [remindEnabled, setRemindEnabled] = useState(true);

    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('alert_reminder_access'), t('alert_reminder_access_msg'));
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert(t('auth_required'), t('alert_task_required_msg'));
            return;
        }

        try {
            await database.write(async () => {
                const newTask = await database.get<Task>('tasks').create(task => {
                    task.title = title;
                    task.notes = notes;
                    task.dueDate = date;
                    task.status = 'pending';
                });

                if (remindEnabled) {
                    await scheduleReminder(newTask.title, date);
                }
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('alert_error'), t('alert_task_sync_error'));
        }
    };

    const scheduleReminder = async (taskTitle: string, scheduleDate: Date) => {
        const trigger = scheduleDate.getTime();
        const now = new Date().getTime();
        
        if (trigger > now) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: t('notif_task_due'),
                    body: `${t('notif_time_to_start')} ${taskTitle}${t('notif_open_details')}`,
                    data: { detail: notes },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: scheduleDate,
                },
            });
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setDate(newDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(date);
            newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setDate(newDate);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={{ flex: 1, backgroundColor: '#f8fafc' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
        >
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.mainCard, styles.shadow]}>
                    <Text style={styles.label}>{t('task_title_label').toUpperCase()}</Text>
                    <TextInput 
                        style={[styles.input, { borderColor: colors.border }]} 
                        placeholder={t('task_title_placeholder')} 
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={[styles.label, { marginTop: 30 }]}>{t('field_action_time').toUpperCase()}</Text>
                    
                    <View style={styles.selectorsRow}>
                        <TouchableOpacity 
                            style={[styles.selector, { borderColor: colors.border, flex: 1, marginRight: 10 }]} 
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.selectorSub}>{t('date')}</Text>
                                <Text style={styles.selectorVal}>{date.toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.selector, { borderColor: colors.border, flex: 1 }]} 
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.selectorSub}>{t('time_ampm').toUpperCase()}</Text>
                                <Text style={styles.selectorVal}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
                    )}

                    {showTimePicker && (
                        <DateTimePicker 
                            value={date} 
                            mode="time" 
                            display="spinner" 
                            is24Hour={false} 
                            onChange={onTimeChange} 
                        />
                    )}

                    <View style={styles.remindRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.remindTitle}>{t('reminder_alert')}</Text>
                        <Text style={styles.remindSub}>{t('reminder_sub')}</Text>
                      </View>
                      <Switch 
                        value={remindEnabled} 
                        onValueChange={setRemindEnabled} 
                        trackColor={{ false: "#767577", true: colors.primary }}
                      />
                    </View>

                    <Text style={[styles.label, { marginTop: 30 }]}>{t('expert_notes_label').toUpperCase()}</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea, { borderColor: colors.border }]} 
                        placeholder={t('expert_notes_placeholder')} 
                        multiline
                        numberOfLines={6}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.addBtn, { backgroundColor: colors.primary }]} 
                    onPress={handleSave}
                >
                    <Ionicons name="add-circle" size={28} color="#fff" style={{ marginRight: 12 }} />
                    <Text style={styles.addBtnText}>+ {t('add_task')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.md },
    mainCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, marginBottom: 30 },
    shadow: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    input: { marginTop: 10, paddingVertical: 15, paddingHorizontal: 0, fontSize: 18, fontWeight: '500', borderBottomWidth: 1 },
    textArea: { height: 120, textAlignVertical: 'top', borderBottomWidth: 0, fontSize: 16 },
    selectorsRow: { flexDirection: 'row', marginTop: 15 },
    selector: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5 },
    selectorVal: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    selectorSub: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
    remindRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, backgroundColor: '#f0f9ff', padding: 20, borderRadius: 20 },
    remindTitle: { fontSize: 16, fontWeight: 'bold', color: '#0369a1' },
    remindSub: { fontSize: 12, color: '#075985', marginTop: 2 },
    addBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 20, elevation: 8, marginHorizontal: spacing.md, marginBottom: 60 },
    addBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
