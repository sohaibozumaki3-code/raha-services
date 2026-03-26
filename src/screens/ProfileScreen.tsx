import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useStore } from '../store/useStore';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

export const ProfileScreen = () => {
  const { user, role, logout } = useStore();
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: any[] = [];
      snapshot.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));
      setUserPosts(postsData);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <Text style={styles.postTime}>{formatDistanceToNow(item.createdAt, { addSuffix: true })}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />}
      <View style={styles.postStats}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={16} color={COLORS.error} />
          <Text style={styles.statText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={16} color={COLORS.textLight} />
          <Text style={styles.statText}>{item.commentsCount || 0}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role || 'customer'}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{userPosts.length}</Text>
            <Text style={styles.profileStatLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{user?.followers?.length || 0}</Text>
            <Text style={styles.profileStatLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{user?.following?.length || 0}</Text>
            <Text style={styles.profileStatLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>My Posts</Text>
        <FlatList
          data={userPosts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No posts yet.</Text>
            </View>
          }
        />
        
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: 32, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: COLORS.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 8 },
  roleBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 24 },
  roleText: { color: COLORS.surface, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  
  statsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 16 },
  profileStatItem: { alignItems: 'center' },
  profileStatValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
  profileStatLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  contentContainer: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 16 },
  postsList: { gap: 12, paddingBottom: 20 },
  postCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  postTime: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  postContent: { fontSize: 14, color: COLORS.text, marginBottom: 12, lineHeight: 20 },
  postImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 12, backgroundColor: COLORS.background },
  postStats: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.textLight, marginTop: 12 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', gap: 8 },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: 'bold' },
});
