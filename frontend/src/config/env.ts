// Environment configuration
const __DEV__ = process.env.NODE_ENV === 'development';

export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.bullroom.usf.edu';

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3003'
  : 'https://notifications.bullroom.usf.edu';

export const API_TIMEOUT = 10000; // 10 seconds
export const BOOKING_HOLD_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
