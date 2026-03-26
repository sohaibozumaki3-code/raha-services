export const Logger = {
  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, data ? data : '');
    }
  },
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, data ? data : '');
    }
  },
  error: (message: string, error?: any) => {
    // In production, this would send to Crashlytics or Sentry
    console.error(`[ERROR] ${message}`, error ? error : '');
  },
  logAction: (action: string, userId: string) => {
    if (__DEV__) {
      console.log(`[ACTION] User ${userId} performed: ${action}`);
    }
  }
};
