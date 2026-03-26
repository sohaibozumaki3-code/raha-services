import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { i18n } from '../i18n';

const STORIES = [
  { id: '1', name: 'Your Story', isAdd: true },
  { id: '2', name: 'Marjane', hasUnseen: true },
  { id: '3', name: 'Ahmed (Driver)', hasUnseen: true },
  { id: '4', name: 'Bim', hasUnseen: false },
];

const POSTS = [
  {
    id: '1',
    author: 'Marjane Temara',
    role: 'Merchant',
    time: '2 hours ago',
    content: 'Special weekend offer! Get 20% off on all fresh fruits and vegetables. Order now through Raha Services! 🍎🥦',
    likes: 124,
    comments: 18,
  },
  {
    id: '2',
    author: 'Karim',
    role: 'Driver',
    time: '5 hours ago',
    content: 'Available for deliveries in Ain Atiq area until 10 PM. Fast and secure service! 🏍️💨',
    likes: 45,
    comments: 3,
  }
];

export const SocialScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('social')}</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            {STORIES.map(story => (
              <TouchableOpacity key={story.id} style={styles.storyItem}>
                <View style={[
                  styles.storyRing, 
                  story.hasUnseen && styles.storyRingUnseen,
                  story.isAdd && styles.storyRingAdd
                ]}>
                  {story.isAdd ? (
                    <Ionicons name="add" size={32} color={COLORS.textLight} />
                  ) : (
                    <Ionicons name="person" size={32} color={COLORS.textLight} />
                  )}
                </View>
                <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.feedContainer}>
          {POSTS.map(post => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Ionicons name="person" size={20} color={COLORS.textLight} />
                </View>
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthorName}>{post.author}</Text>
                  <View style={styles.postMeta}>
                    <Text style={styles.postRole}>{post.role}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={24} color={COLORS.textLight} />
                  <Text style={styles.actionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={22} color={COLORS.textLight} />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={22} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storiesScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  storyRingUnseen: {
    borderColor: COLORS.primary,
  },
  storyRingAdd: {
    borderStyle: 'dashed',
  },
  storyName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  feedContainer: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postRole: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  dot: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    gap: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
