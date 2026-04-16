import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.lastUpdated}>Last Updated: April 16, 2026</Text>

        <Text style={styles.paragraph}>
          Welcome to Smart AI Bus Planner. This Privacy Policy describes how we collect, use, and share your personal information when you use our mobile application.
        </Text>

        <Text style={styles.heading}>1. Data Collection</Text>
        <Text style={styles.paragraph}>
          We collect the following types of information:
          {'\n'}• Account Information: Name, email, phone number, and area.
          {'\n'}• Travel Data: Booking history, frequent routes, and live location (only during active trips).
          {'\n'}• Device Data: Model, OS version, and app performance metrics.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          The collected data is used exclusively to:
          {'\n'}• Provide personalized AI trip suggestions.
          {'\n'}• Process ticket bookings and generate AI Comfort Scores.
          {'\n'}• Send real-time bus tracking updates to you and other commuters.
        </Text>

        <Text style={styles.heading}>3. Third-Party Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data to third parties. Data is shared with:
          {'\n'}• Supabase (Database infrastructure).
          {'\n'}• Payment gateways for secure processing.
          {'\n'}• Analytics providers to improve app performance.
        </Text>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard encryption to protect your data. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
        </Text>

        <Text style={styles.heading}>5. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us via the Help & Support section in the app.
        </Text>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom, paddingTop: Spacing.md },
  
  lastUpdated: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.lg },
  heading: { ...Typography.h4, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  paragraph: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
});
