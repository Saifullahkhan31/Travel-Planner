import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, GenderPreference } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import InputField from '../../components/common/InputField';
import Button     from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

// SCREEN : RegisterScreen
// ROUTE  : Register

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

function validate(name: string, email: string, phone: string, password: string, confirm: string, terms: boolean) {
  if (!name.trim())   return 'Full name is required.';
  if (!email.includes('@')) return 'Enter a valid email address.';
  if (!phone.startsWith('+923') || phone.length < 13) return 'Enter a valid Pakistani phone (+923XXXXXXXXX).';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain a number.';
  if (password !== confirm) return 'Passwords do not match.';
  if (!terms) return 'You must accept the Terms of Service.';
  return null;
}

const GENDER_OPTIONS: { label: string; value: GenderPreference }[] = [
  { label: 'No Preference', value: 'no_preference' },
  { label: 'Female Zone',   value: 'female_only' },
  { label: 'Male Zone',     value: 'male_only' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [phone,    setPhone]   = useState('+923');
  const [password, setPass]    = useState('');
  const [confirm,  setConfirm] = useState('');
  const [showPass, setShowPass]= useState(false);
  const [genderPref, setGender]= useState<GenderPreference>('no_preference');
  const [terms,    setTerms]   = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);

  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getStrength();
  const strengthColors = ['', Colors.error, Colors.warning, Colors.warning, Colors.success];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleRegister = async () => {
    const err = validate(name, email, phone, password, confirm, terms);
    if (err) { setError(err); return; }
    try {
      setLoading(true);
      setError(null);
      const { user, error: apiErr } = await signUp(email.trim(), password, {
        name: name.trim(), phone, genderPreference: genderPref, gender: genderPref === 'female_only' ? 'female' : 'male',
      });
      if (apiErr) { setError(apiErr); return; }
      // AppNavigator will automatically mount RootStack since the session is now active
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Smart Bus Travel Planner</Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <InputField label="Full Name"       value={name}     onChangeText={setName}    placeholder="Saifullah Khan" leftIcon="person-outline" autoCapitalize="words" />
            <InputField label="Email Address"   value={email}    onChangeText={setEmail}   placeholder="you@example.com" leftIcon="mail-outline" keyboardType="email-address" />
            <InputField label="Phone Number"    value={phone}    onChangeText={setPhone}   placeholder="+923001234567" leftIcon="call-outline" keyboardType="phone-pad" />

            <InputField
              label="Password" value={password} onChangeText={setPass}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              secureTextEntry={!showPass} leftIcon="lock-closed-outline"
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPass(p => !p)}
            />
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColors[strength] : Colors.border }]} />
                ))}
                <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>{strengthLabels[strength]}</Text>
              </View>
            )}

            <InputField label="Confirm Password" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secureTextEntry leftIcon="checkmark-circle-outline" />

            {/* Gender preference */}
            <Text style={styles.sectionLabel}>Seating Preference</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderChip, genderPref === opt.value && styles.genderChipActive]}
                  onPress={() => setGender(opt.value)} activeOpacity={0.7}
                >
                  <Text style={[styles.genderChipText, genderPref === opt.value && styles.genderChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setTerms(t => !t)} activeOpacity={0.7}>
              <View style={[styles.checkbox, terms && styles.checkboxChecked]}>
                {terms && <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={styles.termsText}>I accept the <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text></Text>
            </TouchableOpacity>

            <Button label="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.md }} />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  header : { alignItems: 'center', paddingTop: Spacing.xxl, marginBottom: Spacing.xxl },
  title  : { ...Typography.h2, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  card   : {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, ...Shadows.card, marginBottom: Spacing.xl,
  },
  errorBanner: { backgroundColor: Colors.errorTint, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  errorText  : { ...Typography.caption, color: Colors.error },
  sectionLabel: { ...Typography.captionMed, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  genderRow  : { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  genderChip : {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  genderChipActive    : { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderChipText      : { ...Typography.caption, color: Colors.textSecondary },
  genderChipTextActive: { color: Colors.white, fontWeight: '600' },
  strengthRow  : { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  strengthBar  : { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '500', width: 40 },
  termsRow : { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  checkbox : {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText  : { ...Typography.caption, flex: 1, lineHeight: 18 },
  termsLink  : { color: Colors.primary, fontWeight: '600' },
  loginRow   : { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.xxl },
  loginText  : { ...Typography.caption, color: Colors.textSecondary },
  loginLink  : { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
