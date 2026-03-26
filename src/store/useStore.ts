import { create } from 'zustand';
import { i18n } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'customer' | 'driver' | 'merchant' | 'admin' | null;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  walletBalance: number;
  pushToken?: string | null;
  rating: number;
  completedOrders: number;
  followers: string[];
  following: string[];
  preferences: string[]; // for AI suggestions
}

export interface Location {
  latitude: number;
  longitude: number;
  heading?: number;
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'on_the_way' | 'delivered' | 'cancelled';
  items: any[];
  totalAmount: number;
  deliveryFee: number;
  createdAt: number;
  updatedAt: number;
  deliveryLocation: Location;
  pickupLocation: Location;
  paymentMethod: 'cash' | 'wallet' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'location' | 'audio';
  createdAt: number;
  readBy: string[];
  translatedText?: { [lang: string]: string }; // For auto-translation
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  typing?: string[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorPhoto?: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  commentsCount: number;
  createdAt: number;
  isOffer: boolean;
  validUntil?: number;
  discountPercentage?: number;
  couponCode?: string;
}

interface AppState {
  // App Settings
  language: string;
  setLanguage: (lang: string) => void;
  
  // Auth State
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSplashVisible: boolean;
  pushToken: string | null;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  setSplashVisible: (visible: boolean) => void;
  setPushToken: (token: string | null) => void;
  logout: () => void;
  login: (role: UserRole) => void; 
  updateWalletBalance: (amount: number) => void;
  updateUserPreferences: (prefs: string[]) => void;
  
  // Driver State
  location: Location | null;
  setLocation: (location: Location) => void;
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  
  // Customer Tracking State
  driverLocation: Location | null;
  setDriverLocation: (location: Location | null) => void;
  userLocation: Location | null;
  setUserLocation: (location: Location | null) => void;
  
  // Orders State
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  activeOrders: Order[];
  setActiveOrders: (orders: Order[]) => void;

  // Social / Offers
  feedPosts: Post[];
  setFeedPosts: (posts: Post[]) => void;
  activeOffers: Post[];
}

export const useStore = create<AppState>((set) => ({
  // App Settings
  language: i18n.locale,
  setLanguage: (lang) => {
    i18n.locale = lang;
    set({ language: lang });
  },
  
  // Auth State
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  isSplashVisible: true,
  pushToken: null,
  
  // Actions
  setUser: (user) => set({ 
    user, 
    role: user?.role || null, 
    isAuthenticated: !!user 
  }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSplashVisible: (visible) => set({ isSplashVisible: visible }),
  setPushToken: (token) => set({ pushToken: token }),
  login: async (role) => {
    const mockUser = {
      uid: `mock-${role}-123`,
      email: `mock@${role}.com`,
      displayName: `Mock ${role}`,
      phoneNumber: '+212600000000',
      photoURL: null,
      role,
      createdAt: Date.now(),
      walletBalance: 500,
      pushToken: null,
      rating: 4.8,
      completedOrders: role === 'customer' ? 5 : 150,
      followers: [],
      following: [],
      preferences: ['food', 'groceries']
    };
    
    // Save to AsyncStorage for Auto-Login
    try {
      await AsyncStorage.setItem('mock_user', JSON.stringify(mockUser));
    } catch (e) {
      console.error('Failed to save session');
    }

    set({
      role,
      isAuthenticated: true,
      user: mockUser as any
    });
  },
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('mock_user');
    } catch (e) {
      console.error('Failed to remove session');
    }
    
    set({ 
      user: null, 
      role: null, 
      isAuthenticated: false,
      currentOrder: null,
      activeOrders: [],
      location: null,
      driverLocation: null,
      userLocation: null,
      isOnline: false,
      pushToken: null,
      feedPosts: []
    });
  },
  updateWalletBalance: (amount) => set((state) => ({
    user: state.user ? { ...state.user, walletBalance: (state.user.walletBalance || 0) + amount } : null
  })),
  updateUserPreferences: (prefs) => set((state) => ({
    user: state.user ? { ...state.user, preferences: prefs } : null
  })),
  
  // Driver State
  location: null,
  setLocation: (location) => set({ location }),
  isOnline: false,
  toggleOnlineStatus: () => set((state) => ({ isOnline: !state.isOnline })),
  
  // Customer Tracking State
  driverLocation: null,
  setDriverLocation: (location) => set({ driverLocation: location }),
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  // Orders State
  currentOrder: null,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  activeOrders: [],
  setActiveOrders: (orders) => set({ activeOrders: orders }),

  // Social
  feedPosts: [],
  setFeedPosts: (posts) => set({ feedPosts: posts }),
  get activeOffers() {
    return this.feedPosts.filter(p => p.isOffer && (!p.validUntil || p.validUntil > Date.now()));
  }
}));
