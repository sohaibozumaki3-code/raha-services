import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const sendMessage = async (chatId: string, message: any) => {
  // Ensure chat document exists first
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [message.senderId, message.receiverId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(chatRef, {
      updatedAt: serverTimestamp()
    });
  }

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    ...message,
    createdAt: serverTimestamp(),
    seen: false
  });
};

export const listenMessages = (chatId: string, callback: (msgs: any[]) => void) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

export const markMessagesAsSeen = async (chatId: string, userId: string, messages: any[]) => {
  const updates = messages
    .filter(msg => msg.receiverId === userId && !msg.seen)
    .map(msg =>
      updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
        seen: true
      })
    );

  if (updates.length > 0) {
    await Promise.all(updates);
  }
};

export const setTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
  const chatRef = doc(db, 'chats', chatId);
  try {
    await updateDoc(chatRef, {
      [`typing.${userId}`]: isTyping
    });
  } catch (e) {
    // Document might not exist yet, create it
    await setDoc(chatRef, {
      [`typing.${userId}`]: isTyping
    }, { merge: true });
  }
};

export const listenTyping = (chatId: string, callback: (typing: any) => void) => {
  return onSnapshot(doc(db, 'chats', chatId), docSnap => {
    if (docSnap.exists()) {
      callback(docSnap.data().typing || {});
    }
  });
};
