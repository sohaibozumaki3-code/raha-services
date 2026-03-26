import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

// 🔥 إنشاء منشور
export const createPost = async (post: any) => {
  await addDoc(collection(db, "posts"), {
    ...post,
    createdAt: Date.now(),
    likes: [],
  });
};

// 🔥 الاستماع للمنشورات (real-time)
export const listenPosts = (callback: (posts: any[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  return onSnapshot(q, snapshot => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(posts);
  });
};

// 🔥 Like / Unlike
export const toggleLike = async (postId: string, userId: string, likes: string[]) => {
  const postRef = doc(db, "posts", postId);

  if (likes.includes(userId)) {
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
  } else {
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });
  }
};

// 🔥 إضافة تعليق
export const addComment = async (postId: string, comment: any) => {
  await addDoc(collection(db, "posts", postId, "comments"), {
    ...comment,
    createdAt: Date.now(),
  });
};

// 🔥 الاستماع للتعليقات
export const listenComments = (postId: string, callback: (comments: any[]) => void) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, snapshot => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
};
