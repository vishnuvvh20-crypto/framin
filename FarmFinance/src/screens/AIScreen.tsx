import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, Linking, ActivityIndicator, Platform, Alert, Modal, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchYoutubeVideos, YoutubeVideo } from '../services/youtubeService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  videos?: YoutubeVideo[];
};

const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (query.trim()) {
      onSend(query);
      setQuery('');
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          let finalStr = '';
          let interimStr = '';
          for (let i = 0; i < event.results.length; i++) {
             if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript;
             } else {
                interimStr += event.results[i][0].transcript;
             }
          }
          const current = finalStr + interimStr;
          if (current) {
             setQuery(current.trim());
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.start();
      } else {
        window.alert(t('alert_speech_unsupported'));
      }
    } else {
      Alert.alert(t('alert_unavailable'), t('alert_voice_input_mobile'));
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={toggleListening}>
          <Ionicons name={isListening ? "mic" : "mic-outline"} size={22} color={isListening ? colors.primary : colors.textLight} style={{ marginLeft: 15 }} />
        </TouchableOpacity>
        <TextInput 
          style={[styles.textInput, { color: colors.text }]}
          placeholder={t('ask_ai_placeholder')}
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={() => handleSend()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Internal Voice Overlay Component for AIScreen
const VoiceOverlay = ({ visible, onClose, voiceStatus, transcript, voiceGender, setVoiceGender, onMicPress }: any) => {
  const { t } = useLanguage();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (voiceStatus === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [voiceStatus]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: '#06170c' }}>
        <Image 
          source={voiceGender === 'male' ? require('../../assets/male_voice.png') : require('../../assets/female_voice.png')} 
          style={{ width: '100%', height: '115%', position: 'absolute', top: -30 }} 
          resizeMode="cover" 
        />
        
        {/* Soft mask for baked-in text, keeping his head bright */}
        <LinearGradient colors={['rgba(6,23,12,0.8)', 'rgba(6,23,12,0)']} style={{ position: 'absolute', top: 0, width: '100%', height: 60 }} />
        <View style={{ position: 'absolute', top: 5, width: '100%', alignItems: 'center' }}>
          <Text style={{ fontSize: 38, fontWeight: 'bold', color: '#8cc63f' }}>Farmin</Text>
        </View>

        {/* Single Seamless Gradient transition at bottom */}
        <LinearGradient 
          colors={['rgba(6,23,12,0)', '#06170c', '#06170c']} 
          locations={[0, 0.4, 1]}
          style={{ position: 'absolute', bottom: 0, width: '100%', height: 350 }} 
        />

        {/* Top-Right Close Button */}
        <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 10 }} onPress={onClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Dynamic Interactive UI */}
        <View style={{ position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' }}>
          
          <Text style={{ color: '#8cc63f', fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
            {voiceStatus === 'listening' ? t('voice_listening') : voiceStatus === 'thinking' ? t('voice_thinking') : t('voice_speaking')}
          </Text>

          <Text style={{ color: '#e0f0e3', fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 40, minHeight: 40 }}>
            {transcript || t('voice_default_help')}
          </Text>

          <TouchableOpacity onPress={onMicPress}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 20 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: voiceStatus === 'listening' ? '#0a1a10' : '#114a22', borderWidth: 2, borderColor: '#4a9c59', justifyContent: 'center', alignItems: 'center' }}>
                 <Ionicons name={voiceStatus === 'speaking' ? "volume-high" : "mic"} size={36} color="#fff" />
              </View>
            </Animated.View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={() => setVoiceGender('male')} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 20, borderRadius: 25, backgroundColor: voiceGender === 'male' ? '#4a9c59' : '#0a1a10', borderWidth: 1, borderColor: '#4a9c59' }}>
              <Ionicons name="person" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14 }}>{t('voice_male')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setVoiceGender('female')} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 20, borderRadius: 25, backgroundColor: voiceGender === 'female' ? '#4a9c59' : '#0a1a10', borderWidth: 1, borderColor: '#4a9c59' }}>
              <Ionicons name="woman" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14 }}>{t('voice_female')}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: '#4a9c59', fontSize: 12, marginTop: 15 }}>{t('voice_companion_footer')}</Text>
        </View>
      </View>
    </Modal>
  );
};

export const AIScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  // Voice Overlay States
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const voiceRecRef = useRef<any>(null);
  const voiceTranscriptRef = useRef('');

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: t('ai_greeting') }
  ]);

  const startVoiceMode = () => {
    if (Platform.OS === 'web') {
       Speech.speak('', { volume: 0 }); // Unlock audio context on web
    }
    setShowVoiceOverlay(true);
    setVoiceStatus('listening');
    setVoiceTranscript('');
    voiceTranscriptRef.current = '';
    startOverlayListening();
  };

  const closeVoiceMode = () => {
    setShowVoiceOverlay(false);
    if (voiceRecRef.current) {
      voiceRecRef.current.manualStop = true;
      voiceRecRef.current.stop();
    }
    Speech.stop();
  };

  const toggleOverlayListening = () => {
    Speech.stop();
    if (voiceRecRef.current) {
      voiceRecRef.current.manualStop = true;
      voiceRecRef.current.stop();
    }
    setTimeout(() => {
      setVoiceStatus('listening');
      setVoiceTranscript('');
      voiceTranscriptRef.current = '';
      startOverlayListening();
    }, 100);
  };

  const startOverlayListening = () => {
    voiceTranscriptRef.current = '';
    setVoiceTranscript('');
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
         const recognition = new SpeechRecognition();
         voiceRecRef.current = recognition;
         recognition.continuous = false;
         recognition.interimResults = true;
         
         recognition.onerror = (e: any) => {
            console.log('Speech error', e);
            voiceRecRef.current.manualStop = true;
            let msg = 'Microphone error occurred. Ensure you are using localhost or HTTPS.';
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
               msg = 'Microphone access denied. Please ensure you are using HTTPS or localhost.';
            } else if (e.error) {
               msg = `Microphone error: ${e.error}`;
            }
            Alert.alert(t('alert_error') || 'Error', msg);
            closeVoiceMode();
         };

         recognition.onresult = (e: any) => {
            let finalStr = '';
            let interimStr = '';
            for (let i = 0; i < e.results.length; i++) {
              if (e.results[i].isFinal) finalStr += e.results[i][0].transcript;
              else interimStr += e.results[i][0].transcript;
            }
            const current = finalStr + interimStr;
            setVoiceTranscript(current);
            voiceTranscriptRef.current = current;
         };
         recognition.onend = () => {
            if (voiceRecRef.current?.manualStop) return;
            if (voiceTranscriptRef.current.trim()) {
               setVoiceStatus('thinking');
               handleSend(voiceTranscriptRef.current, true);
               // Do not clear the transcript here; leave the user's text on screen while thinking
            } else {
               // restarted if they didn't say anything
               setTimeout(() => {
                 if (!voiceRecRef.current?.manualStop) {
                   startOverlayListening();
                 }
               }, 200);
            }
         };
         recognition.start();
      }
    }
  };

  const speakWithCorrectVoice = async (text: string, options: any, gender: 'female' | 'male' = 'female') => {
    const isTamil = /[\u0B80-\u0BFF]/.test(text);
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      let selectedVoice;
      if (isTamil) {
        let tamilVoices = voices.filter(v => v.language.toLowerCase().includes('ta') || v.name.toLowerCase().includes('tamil'));
        
        const findBestVoice = (list: any[], pattern: RegExp) => {
           const matches = list.filter(v => pattern.test(v.name));
           if (!matches.length) return null;
           return matches.find(v => /(google|natural|online)/i.test(v.name)) || matches[matches.length - 1];
        };

        if (gender === 'male') {
           selectedVoice = findBestVoice(tamilVoices, /(male|valluvar|kumar)/i) || tamilVoices[tamilVoices.length - 1];
        } else {
           selectedVoice = findBestVoice(tamilVoices, /(female|kavitha)/i) || tamilVoices[tamilVoices.length - 1];
        }
      } else {
        let allEngVoices = voices.filter(v => v.language.toLowerCase().includes('en'));
        let indEngVoices = allEngVoices.filter(v => v.language === 'en-IN' || v.name.toLowerCase().includes('india'));
        
        const findBestVoice = (list: any[], pattern: RegExp) => {
           const matches = list.filter(v => pattern.test(v.name));
           if (!matches.length) return null;
           return matches.find(v => /(google|natural|online)/i.test(v.name)) || matches[matches.length - 1];
        };

        if (gender === 'male') {
           selectedVoice = findBestVoice(indEngVoices, /(male|david|ravi|mark|george|brian|ryan)/i)
                        || findBestVoice(allEngVoices, /(male|david|mark|george|brian|ryan)/i)
                        || indEngVoices[indEngVoices.length - 1] || allEngVoices[allEngVoices.length - 1];
        } else {
           selectedVoice = findBestVoice(indEngVoices, /(female|zira|heera|kalpana|susan|linda|hazel|arya)/i)
                        || findBestVoice(allEngVoices, /(female|zira|susan|linda|hazel)/i)
                        || indEngVoices[indEngVoices.length - 1] || allEngVoices[allEngVoices.length - 1];
        }
      }
      Speech.speak(text, {
        ...options,
        language: isTamil ? 'ta-IN' : 'en-IN',
        voice: selectedVoice ? selectedVoice.identifier : undefined,
        pitch: gender === 'female' ? 1.4 : 0.9,
        rate: gender === 'female' ? 1.05 : 1.0,
      });
    } catch (e) {
      Speech.speak(text, { 
        ...options, 
        language: isTamil ? 'ta-IN' : 'en-IN',
        pitch: gender === 'female' ? 1.4 : 0.9,
        rate: gender === 'female' ? 1.05 : 1.0,
      });
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      Speech.stop();
      setSpeakingId(id);
      speakWithCorrectVoice(text, {
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
      }, voiceGender);
    }
  };

  const handleSend = async (text: string, fromVoiceMode = false) => {
    if (!text.trim()) return;
    Speech.stop();
    setSpeakingId(null);
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let aiText = '';
      try {
        const recentMessages = messages.slice(-4);
        const contextStr = recentMessages.map(m => `${m.sender === 'user' ? 'User' : 'Farmin AI'}: ${m.text}`).join('\n');
        const promptWithContext = fromVoiceMode
          ? `You are an interactive voice assistant named Farmin AI. Be extremely concise and conversational like Siri or Gemini. Do not output markdown, just spoken text. Conversation history:\n${contextStr}\n\nUser says: ${text}`
          : recentMessages.length > 0 
            ? `Conversation context:\n${contextStr}\n\nUser's new message: ${text}\n\nPlease reply to the user's new message naturally considering the context.`
            : text;

        const aiRes = await fetch('https://ai-agent-v01.onrender.com/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'message=' + encodeURIComponent(promptWithContext)
        });
        const aiData = await aiRes.json();
        if (aiData && (aiData.message || aiData.response)) {
          let responseText = aiData.message || aiData.response || '';
          aiText = responseText.replace(/chatgpt/ig, 'Farmin AI').replace(/OpenAI/ig, 'Farmin Intelligence');
        }
      } catch (err) {
        console.warn("AI API Server unavailable, triggering local agronomist expert cache:", err);
        const lowercaseText = text.toLowerCase();
        if (lowercaseText.includes('disease') || lowercaseText.includes('pest') || lowercaseText.includes('leaf') || lowercaseText.includes('blight')) {
          aiText = "### 🌾 AI Disease Diagnostician\nSymptoms suggest a potential **Fungal Leaf Blast** infection:\n- **Action Plan**: Spray Tricyclazole 75 WP at 0.6g/liter of water.\n- **Prevention**: Avoid excessive nitrogen fertilizers; improve field drainage.";
        } else if (lowercaseText.includes('fertilizer') || lowercaseText.includes('soil') || lowercaseText.includes('npk') || lowercaseText.includes('nutrient')) {
          aiText = "### 🧪 Smart Soil & Fertilizer Recommendation\nRecommended nutrient management for cereal crops in local soils:\n- **Optimum NPK**: 120:60:40 kg/hectare.\n- **Tip**: Add Zinc Sulfate (25 kg/ha) if soil test shows micro-nutrient depletion.";
        } else if (lowercaseText.includes('price') || lowercaseText.includes('market') || lowercaseText.includes('sell') || lowercaseText.includes('rate')) {
          aiText = "### 📈 Agricultural Market Forecast\nRecent price trends in your regional marketplace:\n- **Paddy**: ₹2,200 - ₹2,400 / quintal (Bullish due to export demand).\n- **Onion**: ₹1,900 - ₹2,250 / quintal (Slightly high supply expected next week).\n- **Cotton**: ₹6,800 - ₹7,200 / quintal (Stable pricing).";
        } else if (lowercaseText.includes('weather') || lowercaseText.includes('rain') || lowercaseText.includes('irrigation')) {
          aiText = "### 🌦️ Irrigation & Weather Advisor\n- **Weather Alert**: Scattered showers predicted within 48 hours.\n- **Irrigation Guidance**: Postpone shallow watering. Keep drainage channels open to prevent waterlogging.";
        } else {
          aiText = "I am Farmin AI, your digital farming assistant. Ask me questions like:\n- *What fertilizer should I use for rice?*\n- *How do I treat leaf spot disease?*\n- *What are the current market prices for onions?*";
        }
      }

      let videos: YoutubeVideo[] = [];
      try {
        videos = await searchYoutubeVideos(text);
      } catch (err) {
        console.error("YT Error:", err);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        videos: videos.length > 0 ? videos : undefined
      };
      setMessages(prev => [...prev, aiMsg]);

      // Automatically speak the response ONLY if in voice mode
      if (fromVoiceMode) {
        Speech.stop();
        setSpeakingId(aiMsg.id);
        setVoiceStatus('speaking');
        setVoiceTranscript(aiText); // Display the AI response text on screen
        
        speakWithCorrectVoice(aiText, {
          onDone: () => {
            if (voiceRecRef.current?.manualStop) return;
            setSpeakingId(null);
            setVoiceStatus('listening');
            startOverlayListening();
          },
          onError: () => {
            if (voiceRecRef.current?.manualStop) return;
            setSpeakingId(null);
            setVoiceStatus('listening');
            startOverlayListening();
          },
          onStopped: () => {
            setSpeakingId(null);
          },
        }, voiceGender);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: t('ai_error_fetching') }]);
    } finally {
      setIsLoading(false);
    }
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
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('ai_research_title')}</Text>
        </View>
        
        <TouchableOpacity onPress={startVoiceMode} style={{ width: 45, height: 45, borderRadius: 22.5, backgroundColor: colors.card, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
          <Image 
            source={require('../../assets/voice_motion.gif')} 
            style={{ width: 100, height: 100, resizeMode: 'cover' }} 
          />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={[styles.liveBadge, { backgroundColor: isDark ? colors.card : '#e0efe5' }]}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[styles.liveText, { color: colors.primary }]}>{t('ai_online')}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
        
        {/* SUGGESTIONS */}
        <View style={styles.chipRow}>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSend(t('ai_chip_rice'))}>
             <Text style={[styles.chipText, { color: colors.text }]}>{t('ai_chip_rice')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSend(t('ai_chip_onion'))}>
             <Text style={[styles.chipText, { color: colors.text }]}>{t('ai_chip_onion')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSend(t('ai_chip_drip'))}>
             <Text style={[styles.chipText, { color: colors.text }]}>{t('ai_chip_drip')}</Text>
          </TouchableOpacity>
        </View>

        {/* CHAT BUBBLES */}
        <View style={styles.chatContainer}>
          {messages.map(msg => (
            <View key={msg.id} style={msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAi}>
              {msg.sender === 'ai' && (
                <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="hardware-chip" size={16} color="#fff" />
                </View>
              )}
              <View style={msg.sender === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {msg.sender === 'ai' ? (
                  <View>
                    <Markdown 
                      style={{ 
                        body: { ...styles.aiText, marginTop: 0, marginBottom: 0, color: colors.text },
                        link: { color: colors.secondary, textDecorationLine: 'underline' }
                      }}
                      onLinkPress={(url) => {
                        Linking.openURL(url);
                        return true;
                      }}
                    >
                      {msg.text}
                    </Markdown>
                    <TouchableOpacity onPress={() => toggleSpeech(msg.id, msg.text)} style={{ alignSelf: 'flex-end', marginTop: 8, padding: 5 }}>
                      <Ionicons name={speakingId === msg.id ? "volume-high" : "volume-medium-outline"} size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.userText}>
                    {msg.text}
                  </Text>
                )}
                {msg.videos && msg.videos.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    {msg.videos.slice(0, 3).map(vid => (
                      <TouchableOpacity key={vid.id} style={[styles.videoCard, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => Linking.openURL(vid.url)}>
                        <Image source={{ uri: vid.thumb }} style={[styles.videoThumb, { backgroundColor: colors.border }]} />
                        <View style={{ flex: 1, padding: 10 }}>
                          <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{vid.title}</Text>
                          <Text style={[styles.videoChannel, { color: colors.textLight }]} numberOfLines={1}>{vid.channel}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
          {isLoading && (
             <View style={styles.messageRowAi}>
               <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
                 <Ionicons name="hardware-chip" size={16} color="#fff" />
               </View>
               <View style={[styles.aiBubble, { padding: 15, backgroundColor: colors.card, borderColor: colors.border }]}>
                 <ActivityIndicator size="small" color={colors.primary} />
               </View>
             </View>
          )}
          {/* Render Voice Overlay at the end */}
          <VoiceOverlay 
            visible={showVoiceOverlay} 
            onClose={closeVoiceMode} 
            voiceStatus={voiceStatus}
            transcript={voiceTranscript}
            voiceGender={voiceGender}
            setVoiceGender={setVoiceGender}
            onMicPress={toggleOverlayListening}
          />
        </View>
      </ScrollView>
      <ChatInput onSend={(t) => handleSend(t, false)} />
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
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0efe5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#0a7a3a' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25, marginTop: 10 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eaeaeb' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#555' },

  chatContainer: { flex: 1 },
  messageRowUser: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 },
  userBubble: { backgroundColor: '#13702a', padding: 15, borderRadius: 16, borderBottomRightRadius: 4, maxWidth: '80%' },
  userText: { color: '#fff', fontSize: 14, lineHeight: 20 },

  messageRowAi: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 15, alignItems: 'flex-end' },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#005a2b', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginBottom: 5 },
  aiBubble: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '80%', borderWidth: 1, borderColor: '#eaeaeb' },
  aiText: { color: '#333', fontSize: 14, lineHeight: 22 },

  inputContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, elevation: 5, padding: 5, borderWidth: 1, borderColor: '#eaeaeb' },
  textInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: '#333' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#005a2b', justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  
  videoCard: { flexDirection: 'row', backgroundColor: '#f9fafa', borderRadius: 8, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: '#eaeaeb' },
  videoThumb: { width: 100, height: 75, backgroundColor: '#ddd' },
  videoTitle: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 4 },
  videoChannel: { fontSize: 11, color: '#666' },
});
