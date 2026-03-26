import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { Logger } from '../../utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { TranslationService } from '../../services/translation';

export const ChatRoomScreen = ({ route, navigation }: any) => {
  const { chatId, title, recipientId } = route.params;
  const { user, language } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Chat Document for typing indicators
  useEffect(() => {
    if (!chatId || !user?.uid) return;
    const chatRef = doc(db, 'chats', chatId);
    
    setDoc(chatRef, { participants: [user.uid, recipientId] }, { merge: true }).catch(e => Logger.error('Failed to init chat doc', e));

    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecipientTyping(data.typing && data.typing.includes(recipientId));
      }
    });
    return () => unsubscribe();
  }, [chatId, recipientId, user?.uid]);

  // Audio Permissions
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Fetch Messages & Handle Read Receipts
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          msgs.push({ id: change.doc.id, ...data });
          
          // Mark as read if I am the recipient and haven't read it yet
          if (data.senderId !== user?.uid && !data.readBy?.includes(user?.uid)) {
            updateDoc(doc(db, 'messages', change.doc.id), {
              readBy: arrayUnion(user?.uid)
            }).catch(e => Logger.error('Failed to mark read', e));
          }
        }
      });
      
      setMessages(prev => {
        const all = [...prev.filter(p => !msgs.find(m => m.id === p.id)), ...msgs];
        return all.sort((a, b) => a.createdAt - b.createdAt);
      });
    });

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  const handleTyping = (val: string) => {
    setText(val);
    if (!isTyping && user?.uid && chatId) {
      setIsTyping(true);
      updateDoc(doc(db, 'chats', chatId), { typing: arrayUnion(user.uid) });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (user?.uid && chatId) {
        updateDoc(doc(db, 'chats', chatId), { typing: arrayRemove(user.uid) });
      }
    }, 2000);
  };

  const sendMessage = async (type: 'text' | 'image' | 'location' | 'audio' = 'text', content: string = text, extraData: any = null) => {
    if (!content.trim() && type === 'text') return;
    if (!user?.uid) return;
    
    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    updateDoc(doc(db, 'chats', chatId), { typing: arrayRemove(user.uid) }).catch(e => null);

    let translatedText = null;
    let finalContent = content;

    // 1. Handle Auto-Translation for Text
    if (type === 'text') {
      finalContent = content.trim();
      // Translate to Arabic and French for recipient
      const arTranslation = await TranslationService.translateText(finalContent, 'ar');
      const frTranslation = await TranslationService.translateText(finalContent, 'fr');
      
      translatedText = {
        en: finalContent, // Original (assuming EN for mock)
        ar: arTranslation,
        fr: frTranslation
      };
    }

    const msgData = {
      chatId,
      senderId: user.uid,
      text: finalContent,
      type,
      createdAt: Date.now(),
      readBy: [user.uid],
      translatedText,
      ...extraData // For location coords or audio duration
    };

    setText('');

    try {
      await addDoc(collection(db, 'messages'), msgData);
      
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: type === 'text' ? finalContent : `Sent a ${type}`,
        lastMessageTime: Date.now()
      });

      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      Logger.error('Error sending message:', error);
    }
  };

  // --- FEATURE: LOCATION ---
  const sendLocation = async () => {
    if (Platform.OS === 'web') {
      // Web fallback for location
      sendMessage('location', 'Shared Location', {
        latitude: 33.9267,
        longitude: -6.8898
      });
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const loc = await Location.getCurrentPositionAsync({});
      sendMessage('location', 'Shared Location', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
    } catch (e) {
      Logger.error('Failed to send location', e);
    }
  };

  // --- FEATURE: AUDIO RECORDING ---
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Logger.warn('Audio recording is not fully supported on web in this mock');
      return;
    }
    
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Logger.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        // In production: Upload `uri` to Firebase Storage, get DownloadURL, then send
        sendMessage('audio', uri, { duration: '0:05' }); // Mock duration
      }
    } catch (err) {
      Logger.error('Failed to stop recording', err);
    }
  };

  const playAudio = async (uri: string, msgId: string) => {
    if (Platform.OS === 'web') {
       // Web audio playback mock
       setPlayingId(msgId);
       setTimeout(() => setPlayingId(null), 5000);
       return;
    }

    try {
      if (sound && playingId === msgId) {
        await sound.stopAsync();
        setPlayingId(null);
        return;
      }

      setPlayingId(msgId);
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      Logger.error('Failed to play audio', error);
      setPlayingId(null);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      sendMessage('image', result.assets[0].uri);
    }
  };

  // --- RENDER HELPERS ---
  const renderMessageContent = (item: any, isMe: boolean) => {
    if (item.type === 'image') {
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image" size={40} color={COLORS.textLight} />
          <Text style={{color: COLORS.surface, fontSize: 12, marginTop: 4}}>Image Attached</Text>
        </View>
      );
    }
    
    if (item.type === 'location') {
      return (
        <View style={styles.locationCard}>
          <Ionicons name="map" size={32} color={isMe ? COLORS.surface : COLORS.primary} />
          <Text style={[styles.messageText, isMe && styles.myMessageText, { marginTop: 8 }]}>Shared Location</Text>
          <Text style={{fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : COLORS.textLight}}>
            {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
          </Text>
        </View>
      );
    }
    
    if (item.type === 'audio') {
      const isPlaying = playingId === item.id;
      return (
        <TouchableOpacity style={styles.audioCard} onPress={() => playAudio(item.text, item.id)}>
          <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={36} color={isMe ? COLORS.surface : COLORS.primary} />
          <View style={styles.audioWaveform}>
            <View style={[styles.waveLine, { backgroundColor: isMe ? COLORS.surface : COLORS.primary }]} />
            <View style={[styles.waveLine, { height: 16, backgroundColor: isMe ? COLORS.surface : COLORS.primary }]} />
            <View style={[styles.waveLine, { height: 24, backgroundColor: isMe ? COLORS.surface : COLORS.primary }]} />
            <View style={[styles.waveLine, { height: 12, backgroundColor: isMe ? COLORS.surface : COLORS.primary }]} />
          </View>
          <Text style={[styles.messageText, isMe && styles.myMessageText, { marginLeft: 12 }]}>{item.duration || '0:00'}</Text>
        </TouchableOpacity>
      );
    }

    // Default Text with Translation
    const displayTxt = item.translatedText && item.translatedText[language] ? item.translatedText[language] : item.text;
    return <Text style={[styles.messageText, isMe && styles.myMessageText]}>{displayTxt}</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{title}</Text>
          {recipientTyping ? (
            <Text style={styles.typingText}>typing...</Text>
          ) : (
            <Text style={styles.headerStatus}>Online</Text>
          )}
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.senderId === user?.uid;
          const isRead = item.readBy?.includes(recipientId);
          
          return (
            <View style={[styles.messageBubbleWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
              <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                
                {renderMessageContent(item, isMe)}
                
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                    {format(item.createdAt, 'HH:mm')}
                  </Text>
                  {isMe && (
                    <Ionicons 
                      name={isRead ? "checkmark-done" : "checkmark"} 
                      size={14} 
                      color={isRead ? "#3B82F6" : "rgba(255,255,255,0.7)"} 
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={sendLocation}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <Ionicons name="image" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            value={text}
            onChangeText={handleTyping}
            multiline
            editable={!isRecording}
          />
          
          {text.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage('text')}>
              <Ionicons name="send" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.micBtn, isRecording && styles.micBtnRecording]} 
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Ionicons name="mic" size={24} color={isRecording ? COLORS.surface : COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
  backBtn: { padding: 8, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
  headerStatus: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  typingText: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic', fontWeight: 'bold' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  listContainer: { padding: 16, gap: 12 },
  messageBubbleWrapper: { width: '100%', marginBottom: 4 },
  myMessageWrapper: { alignItems: 'flex-end' },
  theirMessageWrapper: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  myMessage: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, color: COLORS.text, lineHeight: 22 },
  myMessageText: { color: COLORS.surface },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  messageTime: { fontSize: 10, color: COLORS.textLight },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  imagePlaceholder: { width: 200, height: 150, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locationCard: { width: 200, height: 120, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  audioCard: { flexDirection: 'row', alignItems: 'center', width: 200 },
  audioWaveform: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8, flex: 1 },
  waveLine: { width: 3, height: 8, borderRadius: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  attachBtn: { padding: 10 },
  micBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  micBtnRecording: { backgroundColor: COLORS.error, transform: [{ scale: 1.2 }] },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, minHeight: 48, maxHeight: 120, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
