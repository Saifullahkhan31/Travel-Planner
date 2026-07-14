import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import InputField from '../../components/common/InputField';
import Button     from '../../components/common/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step,    setStep]    = useState<1 | 2>(1);
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true); setError(null);
    const { error } = await authService.resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setStep(2);
    }
  };
  const { setResettingPassword } = useAuth();

  const handleReset = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    if (newPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirm) { setError('Passwords do not match.'); return; }
    
    setLoading(true); setError(null);
    setResettingPassword(true);
    
    // 1. Verify OTP
    const { error: otpError } = await authService.verifyResetOTP(email, otp);
    if (otpError) {
      setError('Invalid code. Please try again.');
      setLoading(false);
      setResettingPassword(false);
      return;
    }

    // 2. Update Password (user is logged in automatically after verifyOtp)
    const { error: passError } = await authService.updatePassword(newPass);
    
    // We instantly sign out so they can log in with their new credentials
    await authService.signOut();
    
    setLoading(false);
    setResettingPassword(false);
    
    if (passError) {
      setError(passError);
    } else {
      setSuccess(true);
      setTimeout(() => navigation.navigate('Login'), 2000);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 40 }}>{step === 1 ? '🔐' : '🛡️'}</Text>
          </View>

          <Text style={styles.title}>{step === 1 ? 'Forgot Password?' : 'Verify Code'}</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your email and we\'ll send you a verification code.'
              : `Code sent to ${email.replace(/(.)(.*)(@.*)/, '$1***$3')}`}
          </Text>

          <View style={styles.card}>
            {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}

            {success && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ Password reset successfully! Redirecting...</Text>
              </View>
            )}

            {step === 1 ? (
              <>
                <InputField label="Email Address" value={email} onChangeText={setEmail}
                  placeholder="you@example.com" leftIcon="mail-outline" keyboardType="email-address" />
                <Button label="Send Verification Code" onPress={handleSend} loading={loading} />
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>6-DIGIT OTP</Text>
                <InputField value={otp} onChangeText={setOtp} placeholder="Enter OTP code"
                  leftIcon="keypad-outline" keyboardType="numeric" />
                <Text style={styles.resend}>Resend code in 0:45</Text>

                <InputField label="New Password" value={newPass} onChangeText={setNewPass}
                  placeholder="Min 8 characters" secureTextEntry leftIcon="lock-closed-outline" />
                <InputField label="Confirm Password" value={confirm} onChangeText={setConfirm}
                  placeholder="Re-enter password" secureTextEntry leftIcon="checkmark-circle-outline" />

                <Button label="Reset Password" onPress={handleReset} loading={loading} style={{ marginTop: Spacing.sm }} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  backBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xxl },
  backText: { ...Typography.bodyMedium, color: Colors.primary },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.xl,
  },
  title   : { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl, lineHeight: 22 },
  card    : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadows.card },
  errorBanner: { backgroundColor: Colors.errorTint, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  errorText  : { ...Typography.caption, color: Colors.error },
  successBanner: { backgroundColor: Colors.successTint, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  successText  : { ...Typography.caption, color: Colors.success },
  sectionLabel : { ...Typography.sectionLabel, marginBottom: Spacing.sm },
  resend       : { ...Typography.caption, color: Colors.primary, textAlign: 'right', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
});
