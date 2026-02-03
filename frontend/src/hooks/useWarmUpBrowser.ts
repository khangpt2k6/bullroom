import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

/**
 * Hook to warm up the browser for OAuth flows
 * This improves the user experience by preloading the browser
 */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the browser on iOS for faster OAuth
    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
