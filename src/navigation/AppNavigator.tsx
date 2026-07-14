import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import RootStack from './RootStack';
import DriverNavigator from './DriverNavigator';
import { Colors } from '../constants/colors';
import { useAlertsListener } from '../hooks/useAlertsListener';

export default function AppNavigator() {
  const { user, loading } = useAuth();
  useAlertsListener();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  if (!user) return <AuthNavigator />;
  
  if (user.role === 'driver') {
    return <DriverNavigator />;
  }
  
  return <RootStack />;
}
