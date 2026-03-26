import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Logger } from "../utils/logger";

// 🔥 Fetch User Profile
export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    Logger.error("Error fetching user profile", error);
    return null;
  }
};

// 🔥 Update Profile
export const updateProfile = async (userId: string, data: any) => {
  try {
    await updateDoc(doc(db, "users", userId), data);
  } catch (error) {
    Logger.error("Error updating profile", error);
  }
};

// 🔥 Listen to User Posts
export const listenUserPosts = (userId: string, callback: (posts: any[]) => void) => {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", userId)
  );

  return onSnapshot(q, snapshot => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort client side since we can't easily compound query without indexes
    posts.sort((a: any, b: any) => b.createdAt - a.createdAt);
    callback(posts);
  }, error => {
    Logger.error("Error listening to user posts", error);
  });
};

// 🔥 Add Rating
export const addRating = async (userId: string, rating: any) => {
  try {
    await addDoc(collection(db, "users", userId, "ratings"), rating);
    
    // Also update the average rating on the user document for quick access
    const ratingsSnapshot = await getDoc(doc(db, "users", userId));
    // ... complex transaction logic omitted for brevity, handled by listener below mostly
  } catch (error) {
    Logger.error("Error adding rating", error);
  }
};

// 🔥 Listen to Ratings
export const listenRatings = (userId: string, callback: (data: { ratings: any[], average: string }) => void) => {
  return onSnapshot(
    collection(db, "users", userId, "ratings"),
    snapshot => {
      const ratings = snapshot.docs.map(doc => doc.data());
      const avg = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length 
        : 0;

      // Optionally update the main user doc with the new average so it's accessible everywhere
      if (ratings.length > 0 && !userId.startsWith('mock')) {
        updateDoc(doc(db, "users", userId), { rating: parseFloat(avg.toFixed(1)) }).catch(() => {});
      }

      callback({
        ratings,
        average: avg.toFixed(1),
      });
    }, error => {
      Logger.error("Error listening to ratings", error);
    }
  );
};
