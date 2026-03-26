import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';
import { useStore } from '../store/useStore';

export const ChatScreen = ({ navigation }: any) => {
  const { user } = useStore();
  
  // Mock active chats for demonstration. In production, fetch from Firestore `chats` collection where userId is in `participants`
  const [chats, setChats] = useState([
    { id: 'chat_1', participantId: 'driver_123', name: 'Ahmed (Driver)', message: 'I am arriving in 5 minutes', time: '10:30 AM', unread: 2, isOnline: true },
    { id: 'chat_2', participantId: 'merchant_456', name: 'Marjane Temara', message: 'Your order is ready for pickup', time: 'Yesterday', unread: 0, isOnline: false },
    { id: 'chat_3', participantId: 'support_789', name: 'Support', message: 'How can we help you today?', time: 'Mon', unread: 0, isOnline: true },
  ]);

  const openChat = (chat: any) => {
    navigation.navigate('ChatRoom', {
      chatId: chat.id,
      title: chat.name,
      recipientId: chat.participantId
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('chat')}</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.textLight} />
              </View>
              {item.isOnline && <View style={styles.onlineBadge} />}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={[styles.chatTime, item.unread > 0 && styles.chatTimeUnread]}>
                  {item.time}
                </Text>
              </View>
              <View style={styles.chatFooter}>
                <Text style={[styles.chatMessage, item.unread > 0 && styles.chatMessageUnread]} numberOfLines={1}>
                  {item.message}
                </Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  chatItem: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.surface },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  chatTime: { fontSize: 12, color: COLORS.textLight },
  chatTimeUnread: { color: COLORS.primary, fontWeight: 'bold' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatMessage: { flex: 1, fontSize: 14, color: COLORS.textLight, marginRight: 16 },
  chatMessageUnread: { color: COLORS.text, fontWeight: '600' },
  unreadBadge: { backgroundColor: COLORS.primary, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: COLORS.surface, fontSize: 12, fontWeight: 'bold' },
});
