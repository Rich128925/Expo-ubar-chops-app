import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: process.env.EXPO_PUBLIC_INSFORGE_URL as string,
  anonKey: process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY as string,
  isServerMode: true, // mobile token flow: returns refreshToken in response body instead of httpOnly cookie
});
