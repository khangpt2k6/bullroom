import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import MainNavigator from './MainNavigator';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* For now, always show Main. Add Auth screen later */}
      <Stack.Screen name="Main" component={MainNavigator} />
    </Stack.Navigator>
  );
}
