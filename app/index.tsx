import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { BrandColors } from '@/constants/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BrandColors.background }}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}
