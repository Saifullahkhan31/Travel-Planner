import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import InputField from '../../components/common/InputField';
import Button     from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

// SCREEN : LoginScreen
// ROUTE  : Login

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  
  const [isDriverMode, setIsDriverMode] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoSmall}>
              <Text style={{ fontSize: 32 }}>🚌</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your Smart Bus {isDriverMode ? 'Driver ' : ''}account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder={isDriverMode ? "driver@smartbusplanner.com" : "you@example.com"}
              keyboardType="email-address"
              leftIcon="mail-outline"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPass}
              leftIcon="lock-closed-outline"
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPass(p => !p)}
            />

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button label="Sign In" onPress={handleSignIn} loading={loading} />
          </View>

          {/* Links */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Create one</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.driverRow}>
            <Text style={styles.registerText}>{isDriverMode ? 'Are you a commuter? ' : 'Are you a driver? '}</Text>
            <TouchableOpacity onPress={() => {
              setIsDriverMode(!isDriverMode);
              setEmail('');
              setPassword('');
              setError(null);
            }} activeOpacity={0.7}>
              <Text style={styles.registerLink}>{isDriverMode ? 'Login as Commuter' : 'Login as a driver'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  header: { alignItems: 'center', paddingTop: Spacing.xxxl, marginBottom: Spacing.xxl },
  logoSmall: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title   : { ...Typography.h2, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.card,
    borderRadius   : BorderRadius.xl,
    padding        : Spacing.xl,
    ...Shadows.card,
    marginBottom   : Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.error + '1A',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, ...Typography.caption, textAlign: 'center' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.xl, marginTop: Spacing.xs },
  forgotText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  driverRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  registerText: { ...Typography.body, color: Colors.textSecondary },
  registerLink: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});
