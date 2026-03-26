import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Logger } from '../../utils/logger';
import { formatDistanceToNow } from 'date-fns';

export const PostCommentsScreen = ({ route, navigation }: any) => {
  const { postId } = route.params;
  const { user } = useStore();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: any[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() });
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSendComment = async () => {
    if (!text.trim() || !user?.uid) return;
    setIsSubmitting(true);

    try {
      // 1. Add Comment
      await addDoc(collection(db, 'comments'), {
        postId,
        authorId: user.uid,
        authorName: user.displayName || 'User',
        text: text.trim(),
        createdAt: Date.now()
      });

      // 2. Increment comments count on Post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      setText('');
    } catch (error) {
      Logger.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={COLORS.textLight} />
            </View>
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.authorName}>{item.authorName}</Text>
                <Text style={styles.time}>{formatDistanceToNow(item.createdAt, { addSuffix: true })}</Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!text.trim() || isSubmitting) && styles.sendBtnDisabled]} 
            onPress={handleSendComment}
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.surface} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
  listContainer: { padding: 16, paddingBottom: 40 },
  commentCard: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  commentContent: { flex: 1, backgroundColor: COLORS.surface, padding: 12, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  authorName: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
  time: { fontSize: 10, color: COLORS.textLight },
  commentText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, minHeight: 44, maxHeight: 100, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 }
});
