import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../db/database';
import { Note } from '../db/models/Note';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Q } from '@nozbe/watermelondb';

const formatNoteDate = (date: Date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
};

const NotesList = ({ notes, navigation, filter, searchQuery }: { notes: Note[], navigation: any, filter: string, searchQuery: string }) => {
  const { colors } = useTheme();
  if (notes.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginVertical: 40 }}>
        <Text style={{ color: '#999' }}>No notes yet.</Text>
      </View>
    );
  }

  return (
    <>
      {notes.filter(note => {
        if (filter === 'Observations') {
          const t = note.title?.toLowerCase() || '';
          const c = note.content?.toLowerCase() || '';
          if (!t.includes('observation') && !c.includes('moisture')) return false;
        } else if (filter === 'Issues') {
          const t = note.title?.toLowerCase() || '';
          const c = note.content?.toLowerCase() || '';
          if (!t.includes('issue') && !t.includes('pest') && !c.includes('issue')) return false;
        }
        if (searchQuery) {
          const sq = searchQuery.toLowerCase();
          const t = note.title?.toLowerCase() || '';
          const c = note.content?.toLowerCase() || '';
          if (!t.includes(sq) && !c.includes(sq)) return false;
        }
        return true;
      }).map(note => {
        const titleLower = note.title ? note.title.toLowerCase() : '';
        const contentLower = note.content ? note.content.toLowerCase() : '';
        
        const isIssue = titleLower.includes('issue') || titleLower.includes('pest') || contentLower.includes('issue');
        const isObs = titleLower.includes('observation') || contentLower.includes('moisture');
        
        let color = '#e2a900';
        let typeStr = 'General';
        if (isIssue) {
          color = '#ba1a1a';
          typeStr = 'Issue';
        } else if (isObs) {
          color = '#0a7a3a';
          typeStr = 'Observation';
        }

        return (
          <TouchableOpacity key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}>
            <View style={styles.noteHeader}>
              <View style={styles.noteCategory}>
                <View style={[styles.categoryDot, { backgroundColor: color }]} />
                <Text style={styles.categoryText}>{typeStr}</Text>
              </View>
              <Text style={[styles.noteDate, { color: colors.textLight }]}>{formatNoteDate(note.createdAt || new Date())}</Text>
            </View>
            <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
            <Text style={[styles.notePreview, { color: colors.textLight }]} numberOfLines={2}>
              {note.content}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
};

const EnhancedNotesList = withObservables([], () => ({
  notes: database.collections.get<Note>('notes').query(Q.sortBy('created_at', Q.desc)).observe(),
}))(NotesList);

export const NotesScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('Recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleCreateNote = async () => {
    if (!newTitle) { Alert.alert('Error', 'Title is required'); return; }
    await database.write(async () => {
      await database.collections.get<Note>('notes').create(note => {
        note.title = newTitle;
        note.content = newContent;
      });
    });
    setNewTitle('');
    setNewContent('');
    setIsModalVisible(false);
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TOP NAVBAR */}
      <View style={styles.topNavbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Feather name="menu" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.primary }]}>Farmin</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* HEADER */}
      <View style={styles.headerRow}>
        {isSearchActive ? (
          <TextInput
            style={{ flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1, color: colors.text, padding: 8, borderRadius: 8, marginRight: 10 }}
            placeholder="Search notes..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        ) : (
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('notes_journal')}</Text>
        )}
        <TouchableOpacity onPress={() => { setIsSearchActive(!isSearchActive); setSearchQuery(''); }}>
          <Ionicons name={isSearchActive ? "close" : "search-outline"} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View style={styles.filtersRow}>
        <TouchableOpacity style={[styles.filterPill, filter === 'Recent' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFilter('Recent')}>
          <Text style={[styles.filterText, filter === 'Recent' ? styles.filterTextActive : { color: colors.text }]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, filter === 'Observations' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFilter('Observations')}>
          <Text style={[styles.filterText, filter === 'Observations' ? styles.filterTextActive : { color: colors.text }]}>Observations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterPill, filter === 'Issues' ? styles.filterPillActive : { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setFilter('Issues')}>
          <Text style={[styles.filterText, filter === 'Issues' ? styles.filterTextActive : { color: colors.text }]}>Issues</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <EnhancedNotesList navigation={navigation} filter={filter} searchQuery={searchQuery} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.mainFab} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="pencil" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{t('add_note')}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={{ borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground, borderRadius: 8, padding: 10, marginBottom: 10 }} placeholderTextColor={colors.textLight} placeholder="Note Title" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={{ borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground, borderRadius: 8, padding: 10, marginBottom: 15, height: 100, textAlignVertical: 'top' }} placeholderTextColor={colors.textLight} placeholder="Note Content" value={newContent} onChangeText={setNewContent} multiline />
            <TouchableOpacity style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center' }} onPress={handleCreateNote}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNavbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 40 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navTitle: { fontSize: 20, fontWeight: '700', color: '#005a2b' },
  separator: { height: 1, backgroundColor: '#f0f0f0', width: '100%' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111' },

  filtersRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e8ecea', borderWidth: 1, borderColor: '#d1d6d3' },
  filterPillActive: { backgroundColor: '#005a2b', borderColor: '#005a2b' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#555' },
  filterTextActive: { color: '#fff' },

  noteCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eaeaeb', elevation: 1 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  noteCategory: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 11, fontWeight: '700', color: '#666', letterSpacing: 0.5 },
  noteDate: { fontSize: 11, color: '#999', fontWeight: '500' },
  noteTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  notePreview: { fontSize: 13, color: '#555', lineHeight: 20 },

  fabContainer: { position: 'absolute', bottom: 20, right: 20, alignItems: 'center', gap: 15 },
  mainFab: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#005a2b', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
