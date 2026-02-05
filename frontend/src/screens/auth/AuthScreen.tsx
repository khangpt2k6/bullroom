import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import {
  USF_GREEN,
  USF_GREEN_LIGHT,
  USF_GREEN_DARK,
  USF_GREEN_LIGHTEST,
  USF_GOLD,
  USF_GOLD_LIGHT,
  USF_GOLD_LIGHTEST
} from '../../theme/colors';
import * as WebBrowser from 'expo-web-browser';
import usflogo from '../../theme/usf.jpg';

// Important: Close the browser when done
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  // Warm up browser for better OAuth UX
  useWarmUpBrowser();

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  // OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGitHubOAuth } = useOAuth({ strategy: 'oauth_github' });


  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleLogin = async () => {
    if (!signInLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // Set the active session
      await setActiveSignIn({ session: result.createdSessionId });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.errors?.[0]?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signUpLoaded) return;

    setLoading(true);
    setError('');

    try {
      // Create the user
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Show verification input instead of creating session immediately
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.errors?.[0]?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUpLoaded) return;

    setLoading(true);
    setError('');

    try {
      // Verify the email with the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      // Create session after successful verification
      await setActiveSignUp({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      console.error('Verification error:', err);

      // Check if email is already verified
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || '';
      if (errorMessage.toLowerCase().includes('already been verified')) {
        setSuccessMessage('✅ Your email is already verified! Redirecting to login...');
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          setPendingVerification(false);
          setIsLogin(true);
          setSuccessMessage('');
          setVerificationCode('');
        }, 2000);
      } else {
        setError(err.errors?.[0]?.message || 'Verification failed. Please check your code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = useCallback(
    async (startOAuth: any) => {
      try {
        setLoading(true);
        setError('');

        console.log('🔐 Starting OAuth flow...');
        const { createdSessionId, setActive, signIn, signUp } = await startOAuth();

        console.log('✅ OAuth response:', { createdSessionId, hasSetActive: !!setActive, signIn, signUp });

        // Check if we have a session ID to activate
        if (createdSessionId) {
          console.log('🔄 Setting active session:', createdSessionId);
          await setActive({ session: createdSessionId });
          console.log('✅ Session activated successfully!');
        }
        // If no session but we have a signUp with a session, activate it
        else if (signUp?.createdSessionId) {
          console.log('🔄 Activating signUp session:', signUp.createdSessionId);
          await setActive({ session: signUp.createdSessionId });
          console.log('✅ SignUp session activated!');
        }
        // If no session but we have a signIn with a session, activate it
        else if (signIn?.createdSessionId) {
          console.log('🔄 Activating signIn session:', signIn.createdSessionId);
          await setActive({ session: signIn.createdSessionId });
          console.log('✅ SignIn session activated!');
        }
        // Handle transfer flow: OAuth succeeded but Clerk needs more fields
        else if (signUp?.status === 'missing_requirements') {
          console.log('🔄 Handling missing_requirements...');
          console.log('Missing fields:', signUp.missingFields);
          console.log('Required fields:', signUp.requiredFields);
          console.log('Optional fields:', signUp.optionalFields);
          console.log('Unverified fields:', signUp.unverifiedFields);
          const externalStatus = signUp.verifications?.externalAccount?.status;
          const emailStatus = signUp.verifications?.emailAddress?.status;
          console.log('External account status:', externalStatus);
          console.log('Email verification status:', emailStatus);

          if (externalStatus === 'transferable') {
            // User already exists with a different auth method - transfer to sign-in
            try {
              const transferResult = await signIn.create({ transfer: true });
              if (transferResult.createdSessionId) {
                await setActive({ session: transferResult.createdSessionId });
                console.log('✅ Transfer sign-in successful!');
                return;
              }
            } catch (transferErr) {
              console.log('Transfer sign-in failed:', transferErr);
            }
          }

          if (externalStatus === 'verified') {
            try {
              // Build update payload for missing fields
              const updateData: Record<string, string> = {};

              // Use email as username if username is missing
              if (signUp.missingFields?.includes('username')) {
                updateData.username = signUp.emailAddress || '';
                console.log('🔄 Setting username to email:', updateData.username);
              }

              const completeResult = await signUp.update(updateData);
              console.log('Update result:', completeResult.status, completeResult.createdSessionId);
              if (completeResult.status === 'complete' && completeResult.createdSessionId) {
                await setActive({ session: completeResult.createdSessionId });
                console.log('✅ Sign-up completed after update!');
                return;
              }
            } catch (updateErr: any) {
              console.log('Sign-up update failed:', updateErr);
              console.log('Update error details:', JSON.stringify(updateErr.errors || updateErr, null, 2));
            }
          }

          console.warn('⚠️ Could not complete OAuth sign-up automatically.', {
            missingFields: signUp.missingFields,
            unverifiedFields: signUp.unverifiedFields,
          });
          setError(`OAuth sign-up incomplete. Missing: ${(signUp.missingFields || []).join(', ') || 'unknown'}. Unverified: ${(signUp.unverifiedFields || []).join(', ') || 'none'}.`);
        }
        else {
          console.warn('⚠️ No session found in OAuth response', {
            createdSessionId,
            signInSessionId: signIn?.createdSessionId,
            signUpSessionId: signUp?.createdSessionId,
            signInStatus: signIn?.status,
            signUpStatus: signUp?.status
          });
          setError('Authentication completed but session creation failed. Please try logging in manually.');
        }
      } catch (err: any) {
        console.error('❌ OAuth error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        setError(err.message || 'OAuth sign in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="school" size={64} color={USF_GREEN} />
          </View>
          <Text variant="displaySmall" style={styles.title}>
            BullRoom
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            USF Study Room Booking
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              {pendingVerification ? 'Verify Your Email' : isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {successMessage ? (
              <Text style={styles.successText}>{successMessage}</Text>
            ) : null}

            {/* Email Verification Form */}
            {pendingVerification ? (
              <>
                <Text style={styles.verificationText}>
                  We've sent a verification code to {email}. Please enter it below.
                </Text>

                <TextInput
                  label="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  disabled={loading}
                  placeholder="Enter 6-digit code"
                  left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="shield-check" size={24} color={USF_GREEN_LIGHT} />} />}
                  outlineColor={USF_GOLD_LIGHT}
                  activeOutlineColor={USF_GREEN}
                />

                <Button
                  mode="contained"
                  onPress={handleVerifyEmail}
                  loading={loading}
                  disabled={loading || !verificationCode}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Verify Email
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setPendingVerification(false);
                    setVerificationCode('');
                    setError('');
                    setSuccessMessage('');
                  }}
                  disabled={loading}
                  style={styles.switchButton}
                >
                  Back to Sign Up
                </Button>
              </>
            ) : (
              <>
                {/* Social Login Icons Row */}
            <View style={styles.socialIconsRow}>
              <Card
                style={styles.socialIconCard}
                onPress={() => !loading && handleOAuthSignIn(startGoogleOAuth)}
                mode="outlined"
              >
                <Card.Content style={styles.socialIconContent}>
                  <MaterialCommunityIcons name="google" size={36} color="#DB4437" />
                  <Text style={[styles.socialIconLabel, { color: '#DB4437' }]}>Google</Text>
                </Card.Content>
              </Card>

              <Card
                style={styles.socialIconCard}
                onPress={() => !loading && handleOAuthSignIn(startGitHubOAuth)}
                mode="outlined"
              >
                <Card.Content style={styles.socialIconContent}>
                  <MaterialCommunityIcons name="github" size={36} color="#333333" />
                  <Text style={[styles.socialIconLabel, { color: '#333333' }]}>GitHub</Text>
                </Card.Content>
              </Card>

            </View>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <Divider style={styles.divider} />
            </View>

            {/* Email/Password Form */}
            {!isLogin && (
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
                disabled={loading}
                left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="account" size={24} color={USF_GREEN_LIGHT} />} />}
                outlineColor={USF_GOLD_LIGHT}
                activeOutlineColor={USF_GREEN}
              />
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              disabled={loading}
              left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="email" size={24} color={USF_GREEN_LIGHT} />} />}
              outlineColor={USF_GOLD_LIGHT}
              activeOutlineColor={USF_GREEN}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              disabled={loading}
              left={<TextInput.Icon icon={() => <MaterialCommunityIcons name="lock" size={24} color={USF_GREEN_LIGHT} />} />}
              outlineColor={USF_GOLD_LIGHT}
              activeOutlineColor={USF_GREEN}
            />

            <Button
              mode="contained"
              onPress={isLogin ? handleLogin : handleSignup}
              loading={loading}
              disabled={loading || !email || !password || (!isLogin && !name)}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
              }}
              disabled={loading}
              style={styles.switchButton}
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Log In'}
            </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: USF_GREEN_LIGHTEST,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: USF_GOLD_LIGHTEST,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: USF_GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontWeight: 'bold',
    color: USF_GREEN_DARK,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: USF_GREEN,
    fontWeight: '500',
  },
  card: {
    elevation: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: USF_GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: USF_GREEN_DARK,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 24,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  successText: {
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  verificationText: {
    marginBottom: 16,
    textAlign: 'center',
    color: USF_GREEN,
    fontSize: 14,
    lineHeight: 20,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
    paddingHorizontal: 8,
  },
  socialIconCard: {
    flex: 1,
    maxWidth: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: USF_GOLD_LIGHT,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: USF_GREEN_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  socialIconContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  socialIconLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    backgroundColor: USF_GOLD_LIGHT,
  },
  dividerText: {
    marginHorizontal: 16,
    color: USF_GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 12,
    backgroundColor: USF_GREEN,
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
  switchButton: {
    marginTop: 12,
  },
});
