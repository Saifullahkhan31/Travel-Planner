import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;
type Step = 'confirm' | 'otp' | 'newPassword';

const STEPS: Step[] = ['confirm', 'otp', 'newPassword'];
const STEP_LABELS = ['Confirm', 'Verify OTP', 'New Password'];

// ─── OTP Box Component ────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 1) {
      // Paste handling — fill all boxes
      const pasted = cleaned.slice(0, 6).split('');
      const filled = pasted.concat(Array(6).fill('')).slice(0, 6);
      onChange(filled.join(''));
      inputs.current[Math.min(pasted.length - 1, 5)]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    onChange(newDigits.join(''));

    if (cleaned && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join(''));
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={otpStyles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={r => { inputs.current[i] = r; }}
          style={[otpStyles.box, digit ? otpStyles.boxFilled : {}]}
          value={digit}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={6} // allows paste
          selectTextOnFocus
          textAlign="center"
          caretHidden
        />
      ))}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  row    : { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: Spacing.xl },
  box    : {
    width: 48, height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.background,
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    textAlign: 'center',
  },
  boxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryTint + '50' },
});

// ─── Password Field Component ─────────────────────────────────────────────────
function PasswordField({
  label, value, onChangeText, placeholder, visible, onToggle,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; visible: boolean; onToggle: () => void;
}) {
  return (
    <View style={pwStyles.wrapper}>
      <Text style={pwStyles.label}>{label}</Text>
      <View style={pwStyles.container}>
        <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={pwStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={pwStyles.eye}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pwStyles = StyleSheet.create({
  wrapper  : { marginBottom: Spacing.md, width: '100%' },
  label    : { ...Typography.captionMed, color: Colors.textPrimary, marginBottom: Spacing.xs, fontWeight: '600' },
  container: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  input    : { flex: 1, ...Typography.body, color: Colors.textPrimary, height: '100%' },
  eye      : { padding: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChangePasswordScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [step, setStep]                     = useState<Step>('confirm');
  const [otp, setOtp]                       = useState('');
  const [oldPassword, setOldPassword]       = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [showOld, setShowOld]               = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const passwordsMatch = newPassword === confirmPassword;
  const passwordsHaveValue = newPassword.length > 0 && confirmPassword.length > 0;

  // ─── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!user?.email) return;
    setLoading(true);
    const { error } = await authService.resetPassword(user.email);
    setLoading(false);
    if (error) Alert.alert('Error', error);
    else setStep('otp');
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!user?.email) return;
    if (otp.replace(/\s/g, '').length < 6) {
      Alert.alert('Incomplete OTP', 'Please fill all 6 digits.');
      return;
    }
    setLoading(true);
    const { error } = await authService.verifyResetOTP(user.email, otp.trim());
    setLoading(false);
    if (error) Alert.alert('Invalid Code', 'The OTP is incorrect or has expired. Please try again or resend.');
    else setStep('newPassword');
  };

  // ─── Step 3: Update Password ────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (oldPassword === newPassword) {
      Alert.alert('Same Password', 'Your new password must be different from the current one.');
      return;
    }
    setLoading(true);
    const { error } = await authService.updatePassword(newPassword);
    setLoading(false);
    if (error) Alert.alert('Error', error);
    else {
      Alert.alert('Success 🎉', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Change Password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Progress Bar ── */}
          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.progressStep}>
                <View style={[styles.dot, i <= stepIndex && styles.dotActive]}>
                  {i < stepIndex
                    ? <Ionicons name="checkmark" size={14} color={Colors.white} />
                    : <Text style={[styles.dotNum, i === stepIndex && { color: Colors.white }]}>{i + 1}</Text>
                  }
                </View>
                {i < 2 && <View style={[styles.line, i < stepIndex && styles.lineActive]} />}
              </View>
            ))}
          </View>
          <View style={styles.labelRow}>
            {STEP_LABELS.map((l, i) => (
              <Text key={l} style={[styles.stepLabel, i === stepIndex && styles.stepLabelActive]}>{l}</Text>
            ))}
          </View>

          {/* ── Step 1: Confirm ── */}
          {step === 'confirm' && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Verify Your Identity</Text>
              <Text style={styles.cardSub}>
                A one-time password will be sent to
              </Text>
              <Text style={styles.emailChip}>{user?.email}</Text>
              <Text style={styles.cardSub}>to confirm it's really you.</Text>

              <Button
                label={loading ? 'Sending…' : 'Send OTP to Email'}
                onPress={handleSendOtp}
                disabled={loading}
                style={styles.btn}
                iconLeft="mail-outline"
              />
            </View>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="keypad" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Enter OTP</Text>
              <Text style={styles.cardSub}>
                Check your inbox at{' '}
                <Text style={styles.bold}>{user?.email}</Text>
                {' '}and enter the 6-digit code.
              </Text>

              <OtpInput value={otp} onChange={setOtp} />

              <Button
                label={loading ? 'Verifying…' : 'Verify Code'}
                onPress={handleVerifyOtp}
                disabled={loading || otp.replace(/\s/g,'').length < 6}
                style={styles.btn}
                iconLeft="shield-checkmark-outline"
              />

              <TouchableOpacity onPress={handleSendOtp} style={styles.resendRow} activeOpacity={0.7}>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'newPassword' && (
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.successTint }]}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              </View>
              <Text style={styles.cardTitle}>Set New Password</Text>
              <Text style={styles.cardSub}>Identity verified! Enter your current password then choose a strong new one.</Text>

              <View style={{ width: '100%', marginTop: Spacing.lg }}>
                <PasswordField
                  label="Current Password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter your current password"
                  visible={showOld}
                  onToggle={() => setShowOld(p => !p)}
                />
                <View style={styles.divider} />
                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  visible={showNew}
                  onToggle={() => setShowNew(p => !p)}
                />
                <PasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  visible={showConfirm}
                  onToggle={() => setShowConfirm(p => !p)}
                />

                {passwordsHaveValue && !passwordsMatch && (
                  <View style={styles.mismatchRow}>
                    <Ionicons name="warning-outline" size={14} color={Colors.error} />
                    <Text style={styles.mismatchText}>Passwords do not match</Text>
                  </View>
                )}
                {passwordsHaveValue && passwordsMatch && newPassword.length >= 6 && (
                  <View style={styles.matchRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                    <Text style={styles.matchText}>Passwords match</Text>
                  </View>
                )}
              </View>

              <Button
                label={loading ? 'Updating…' : 'Update Password'}
                onPress={handleUpdatePassword}
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                style={styles.btn}
                iconLeft="lock-closed-outline"
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  // Progress
  progressRow : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs, marginTop: Spacing.md },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  dot         : { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dotActive   : { backgroundColor: Colors.primary },
  dotNum      : { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  line        : { width: 52, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  lineActive  : { backgroundColor: Colors.primary },
  labelRow    : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl, paddingHorizontal: Spacing.xs },
  stepLabel   : { ...Typography.tiny, color: Colors.textMuted, textAlign: 'center', flex: 1 },
  stepLabelActive: { color: Colors.primary, fontWeight: '700' },

  // Card
  card      : { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', ...Shadows.float },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  cardTitle : { ...Typography.h3, textAlign: 'center', marginBottom: Spacing.sm },
  cardSub   : { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emailChip : { ...Typography.captionMed, color: Colors.primary, fontWeight: '700', marginVertical: Spacing.xs },
  bold      : { fontWeight: '700', color: Colors.textPrimary },

  divider   : { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },

  mismatchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -Spacing.xs, marginBottom: Spacing.sm },
  mismatchText: { ...Typography.tiny, color: Colors.error },
  matchRow   : { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -Spacing.xs, marginBottom: Spacing.sm },
  matchText  : { ...Typography.tiny, color: Colors.success },

  btn       : { width: '100%', marginTop: Spacing.lg },
  resendRow : { flexDirection: 'row', marginTop: Spacing.md },
  resendText: { ...Typography.caption, color: Colors.textSecondary },
  resendLink: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
