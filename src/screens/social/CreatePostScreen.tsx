import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, Text, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createPost } from "../../services/socialService";
import { uploadImage } from "../../services/uploadImage";
import { useStore } from "../../store/useStore";
import { COLORS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export const CreatePostScreen = ({ navigation }: any) => {
  const { user } = useStore();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !image) return;
    if (!user) return;
    
    setIsPosting(true);
    let imageUrl = null;

    if (image) {
      imageUrl = await uploadImage(image, "posts");
    }

    await createPost({
      text,
      image: imageUrl,
      userId: user.uid,
      userName: user.displayName || "User",
      userRole: user.role
    });

    setText("");
    setImage(null);
    setIsPosting(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[styles.postBtn, (!text.trim() && !image) && styles.postBtnDisabled]} 
          onPress={handlePost}
          disabled={(!text.trim() && !image) || isPosting}
        >
          {isPosting ? <ActivityIndicator color={COLORS.surface} size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={COLORS.surface} />
          </View>
          <Text style={styles.userName}>{user?.displayName || "User"}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={COLORS.textLight}
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
        />

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
          <Ionicons name="image" size={24} color={COLORS.primary} />
          <Text style={styles.mediaText}>Photo / Video</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
  postBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary },
  input: { fontSize: 18, color: COLORS.text, minHeight: 100, textAlignVertical: 'top' },
  imageContainer: { marginTop: 16, position: 'relative' },
  image: { width: '100%', height: 300, borderRadius: 16 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mediaText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary }
});
