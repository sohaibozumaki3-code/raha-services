import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { listenPosts, toggleLike, addComment, listenComments } from "../../services/socialService";
import { useStore } from "../../store/useStore";
import { COLORS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

export const SocialFeedScreen = ({ navigation }: any) => {
  const { user } = useStore();
  const [posts, setPosts] = useState<any>({});
  const [comments, setComments] = useState<any>({});
  const [commentInputs, setCommentInputs] = useState<any>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenPosts((data) => {
      const formatted: any = {};
      data.forEach(post => {
        formatted[post.id] = post;
      });
      setPosts(formatted);
    });
    return unsubscribe;
  }, []);

  const handleLike = (postId: string) => {
    if (!user) return;
    const post = posts[postId];
    toggleLike(postId, user.uid, post.likes || []);
  };

  const handleComment = async (postId: string) => {
    if (!user) return;
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    await addComment(postId, {
      text: text.trim(),
      userId: user.uid,
      userName: user.displayName || "User"
    });

    setCommentInputs((prev: any) => ({ ...prev, [postId]: "" }));
  };

  const toggleComments = (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      listenComments(postId, (data) => {
        setComments((prev: any) => ({
          ...prev,
          [postId]: data
        }));
      });
    }
  };

  const renderPost = ({ item: postId }: any) => {
    const post = posts[postId];
    const isLiked = post.likes?.includes(user?.uid);
    const showComments = activeCommentPostId === postId;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={COLORS.surface} />
          </View>
          <View style={styles.postAuthorInfo}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.postTime}>
              {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true }) : 'Just now'}
            </Text>
          </View>
        </View>

        {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}

        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(postId)}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? COLORS.error : COLORS.textLight} />
            <Text style={[styles.actionText, isLiked && { color: COLORS.error, fontWeight: 'bold' }]}>
              {post.likes?.length || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostComments', { postId })}>
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.textLight} />
            <Text style={styles.actionText}>Comments</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            {comments[postId]?.map((c: any) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.userName}: </Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))}

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentInputs[postId] || ""}
                onChangeText={(text) => setCommentInputs((prev: any) => ({ ...prev, [postId]: text }))}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !commentInputs[postId]?.trim() && { opacity: 0.5 }]} 
                onPress={() => handleComment(postId)}
                disabled={!commentInputs[postId]?.trim()}
              >
                <Ionicons name="send" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreatePost')}>
          <Ionicons name="add" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={Object.keys(posts)}
          renderItem={renderPost}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  createBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  listContainer: { padding: 16, gap: 16, paddingBottom: 40 },
  postCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  postAuthorInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  postTime: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  postText: { fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 12 },
  postImage: { width: "100%", height: 250, borderRadius: 12, marginBottom: 12, backgroundColor: COLORS.background },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, gap: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  commentsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 8, backgroundColor: COLORS.background, padding: 10, borderRadius: 12 },
  commentAuthor: { fontWeight: 'bold', color: COLORS.secondary },
  commentText: { color: COLORS.text, flex: 1 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  commentInput: { flex: 1, fontSize: 14, color: COLORS.text, minHeight: 36 },
  sendBtn: { padding: 8, marginLeft: 8 }
});
