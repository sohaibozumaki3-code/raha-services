import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, listenUserPosts, listenRatings, updateProfile, addRating } from "../../services/profileService";
import { useStore } from "../../store/useStore";
import { formatDistanceToNow } from 'date-fns';

export const PublicProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const { user: currentUser } = useStore();

  const [profile, setProfile] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState({ average: '0.0' });
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    loadProfile();

    const unsubPosts = listenUserPosts(userId, setPosts);
    const unsubRatings = listenRatings(userId, setRatingData);

    return () => {
      unsubPosts();
      unsubRatings();
    };
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getUserProfile(userId);
    if (data) {
      setProfile(data);
      setBio(data.bio || "");
    }
    setLoading(false);
  };

  const handleUpdateBio = async () => {
    await updateProfile(userId, { bio });
    setIsEditingBio(false);
  };

  const handleRate = async (value: number) => {
    if (!currentUser) return;
    await addRating(userId, { 
      value, 
      raterId: currentUser.uid,
      createdAt: Date.now() 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={40} color={COLORS.primary} />
              )}
            </View>

            <Text style={styles.name}>{profile.displayName || profile.name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile.role}</Text>
            </View>

            {/* Bio Section */}
            <View style={styles.bioContainer}>
              {isEditingBio ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Write something about yourself..."
                    multiline
                  />
                  <TouchableOpacity style={styles.saveBioBtn} onPress={handleUpdateBio}>
                    <Text style={styles.saveBioText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  disabled={!isOwnProfile} 
                  onPress={() => setIsEditingBio(true)}
                  style={styles.bioDisplayContainer}
                >
                  <Text style={styles.bioText}>{bio || (isOwnProfile ? "Tap to add a bio..." : "No bio provided.")}</Text>
                  {isOwnProfile && <Ionicons name="pencil" size={16} color={COLORS.textLight} />}
                </TouchableOpacity>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{ratingData.average}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.completedOrders || 0}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
            </View>

            {/* Rating Action (If not own profile) */}
            {!isOwnProfile && (
              <View style={styles.rateActionContainer}>
                <Text style={styles.rateLabel}>Rate this user:</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity key={n} onPress={() => handleRate(n)} style={styles.starBtn}>
                      <Ionicons name="star-outline" size={28} color="#F59E0B" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Actions Row */}
            {!isOwnProfile && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.primaryActionBtn}
                  onPress={() => navigation.navigate('ChatRoom', { chatId: `chat_${currentUser?.uid}_${userId}`, title: profile.displayName || 'User', recipientId: userId })}
                >
                  <Ionicons name="chatbubble" size={20} color={COLORS.surface} />
                  <Text style={styles.primaryActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.postsSectionTitle}>Recent Posts</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No posts yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatarSmall}>
                {profile.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={{width: 32, height: 32, borderRadius: 16}} />
                ) : (
                  <Ionicons name="person" size={16} color={COLORS.textLight} />
                )}
              </View>
              <View>
                <Text style={styles.postAuthor}>{profile.displayName || 'User'}</Text>
                <Text style={styles.postTime}>{formatDistanceToNow(item.createdAt, { addSuffix: true })}</Text>
              </View>
            </View>
            
            <Text style={styles.postContent}>{item.content || item.text}</Text>
            
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.postImage} />
            )}
            
            <View style={styles.postFooter}>
              <View style={styles.postAction}>
                <Ionicons name="heart-outline" size={20} color={COLORS.textLight} />
                <Text style={styles.postActionText}>{item.likes?.length || 0}</Text>
              </View>
              <View style={styles.postAction}>
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.postActionText}>{item.commentsCount || 0}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
  
  profileHeader: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: COLORS.background },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 8 },
  roleBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  roleText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  
  bioContainer: { width: '100%', marginBottom: 24 },
  bioDisplayContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  bioText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', fontStyle: 'italic' },
  bioEditContainer: { width: '100%', alignItems: 'center' },
  bioInput: { width: '100%', backgroundColor: COLORS.background, borderRadius: 12, padding: 12, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  saveBioBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16 },
  saveBioText: { color: COLORS.surface, fontWeight: 'bold' },

  statsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 16, marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  rateActionContainer: { alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#FFFBEB', borderRadius: 16, width: '100%', borderWidth: 1, borderColor: '#FDE68A' },
  rateLabel: { fontSize: 14, fontWeight: 'bold', color: '#92400E', marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 4 },

  actionRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 24 },
  primaryActionBtn: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  primaryActionText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },

  postsSectionTitle: { alignSelf: 'flex-start', fontSize: 18, fontWeight: 'bold', color: COLORS.secondary, marginTop: 8 },
  
  postCard: { backgroundColor: COLORS.surface, padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  postAuthor: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
  postTime: { fontSize: 12, color: COLORS.textLight },
  postContent: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  postFooter: { flexDirection: 'row', gap: 24, borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 12 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },

  emptyPosts: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 16 }
});
