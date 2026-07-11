import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../db/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Note } from '../db/models/Note';
import { useLanguage } from '../context/LanguageContext';

// SAFE IMPORTS (Conditional)
let ExpoPrint: any = null;
let ExpoSharing: any = null;
try {
  ExpoPrint = require('expo-print');
  ExpoSharing = require('expo-sharing');
} catch (e) {}

const NoteDetailBase = ({ note, navigation }: { note: Note, navigation: any }) => {
  const { colors, typography } = useTheme();
  const { t } = useLanguage();

  const handleDownloadPDF = async () => {
    if (!ExpoPrint || !ExpoSharing) {
      Alert.alert(t('alert_module_unavailable'), t('alert_pdf_exports_msg'));
      return;
    }

    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 50px;">
          <h1 style="color: ${colors.primary}; font-size: 36px;">${note.title}</h1>
          <p style="color: #666; font-size: 14px;">${t('pdf_created_on')} ${note.createdAt.toLocaleDateString()}</p>
          <hr />
          <div style="font-size: 18px; line-height: 1.6; margin-top: 30px; white-space: pre-wrap;">
            ${note.content}
          </div>
          <footer style="margin-top: 100px; text-align: center; color: #999;">${t('pdf_note_footer')}</footer>
        </body>
      </html>
    `;

    try {
      const { uri } = await ExpoPrint.printToFileAsync({ html });
      await ExpoSharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert(t('alert_error'), t('alert_export_failed'));
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('alert_confirm_remove_entry'));
      if (confirmed) {
        await database.write(async () => { await note.markAsDeleted(); navigation.goBack(); });
      }
    } else {
      Alert.alert(t('alert_delete_note'), t('alert_confirm_remove_entry'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: async () => {
            await database.write(async () => { await note.markAsDeleted(); navigation.goBack(); });
          }
        }
      ]);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
           <Text style={[typography.header, { fontSize: 28, textAlign: 'left', width: '100%' }]}>
             {note.title}
           </Text>
           <Text style={[typography.caption, { color: colors.textLight, alignSelf: 'flex-start', marginTop: 10 }]}>
            📅 {note.createdAt.toLocaleDateString()} {t('time_at')} {note.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={[typography.body, { fontSize: 17, lineHeight: 26 }]}>
          {note.content || t('note_content_empty')}
        </Text>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.primary }]} onPress={handleDownloadPDF}>
          <Ionicons name="cloud-download-outline" size={24} color="#fff" />
          <Text style={styles.btnText}>{t('download_pdf')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.error }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, marginLeft: 10, fontWeight: 'bold' }}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const NoteDetailScreen = withObservables(['route'], ({ route }: any) => ({
  note: database.collections.get<Note>('notes').findAndObserve(route.params.noteId),
}))(NoteDetailBase);

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: spacing.md, borderRadius: 16, padding: spacing.xl, minHeight: 400 },
  header: { marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: spacing.xl, opacity: 0.5 },
  footerActions: { padding: spacing.md },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, marginBottom: 15 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});
