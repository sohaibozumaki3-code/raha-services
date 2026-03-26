import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Logger } from '../utils/logger';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  /**
   * Registers the device for push notifications and returns the token
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Logger.warn('Failed to get push token for push notification!');
        return null;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        Logger.info('Push token generated:', token);
      } catch (e) {
        Logger.error('Error generating push token:', e);
      }
    } else {
      Logger.warn('Must use physical device for Push Notifications');
    }

    return token || null;
  },

  /**
   * Updates the user's push token in Firestore
   */
  saveTokenToFirestore: async (userId: string, token: string) => {
    if (!userId || !token || userId.startsWith('mock')) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: token,
        updatedAt: Date.now()
      });
      Logger.info(`Saved push token for user ${userId}`);
    } catch (error) {
      Logger.error('Error saving push token to Firestore:', error);
    }
  },

  /**
   * Helper to send a local notification (useful for testing or immediate feedback)
   */
  sendLocalNotification: async (title: string, body: string, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }
};
