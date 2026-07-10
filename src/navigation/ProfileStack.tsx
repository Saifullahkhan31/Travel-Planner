import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen           from '../screens/profile/ProfileScreen';
import EditProfileScreen       from '../screens/profile/EditProfileScreen';
import PreferencesScreen       from '../screens/profile/PreferencesScreen';
import SettingsScreen          from '../screens/profile/SettingsScreen';
import HelpSupportScreen       from '../screens/profile/HelpSupportScreen';
import PrivacyPolicyScreen     from '../screens/profile/PrivacyPolicyScreen';
import ChangePasswordScreen    from '../screens/profile/ChangePasswordScreen';
import { ProfileStackParamList } from '../types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"        component={ProfileScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="Preferences"    component={PreferencesScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="HelpSupport"    component={HelpSupportScreen} />
      <Stack.Screen name="PrivacyPolicy"  component={PrivacyPolicyScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
