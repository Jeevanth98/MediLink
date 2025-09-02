import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/SimpleAuthContext';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithPhone, confirmPhoneNumber } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Welcome message will be shown on Home screen after navigation
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const confirm = await signInWithPhone(phoneNumber);
      setConfirmation(confirm);
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPConfirmation = async () => {
    if (!otp || !confirmation) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await confirmPhoneNumber(confirmation, otp);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome to MediLink
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your health companion
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <SegmentedButtons
                value={loginMethod}
                onValueChange={setLoginMethod}
                buttons={[
                  { value: 'email', label: 'Email' },
                  { value: 'phone', label: 'Phone' },
                ]}
                style={styles.segmentedButtons}
              />

              {loginMethod === 'email' ? (
                <View style={styles.formContainer}>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    error={email !== '' && !validateEmail(email)}
                  />
                  <HelperText type="error" visible={email !== '' && !validateEmail(email)}>
                    Please enter a valid email address
                  </HelperText>

                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    onPress={handleEmailLogin}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                  >
                    Sign In
                  </Button>

                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.textButton}
                  >
                    Forgot Password?
                  </Button>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {!confirmation ? (
                    <>
                      <TextInput
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        mode="outlined"
                        keyboardType="phone-pad"
                        placeholder="+1234567890"
                        style={styles.input}
                      />
                      <Button
                        mode="contained"
                        onPress={handlePhoneLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                      >
                        Send OTP
                      </Button>
                    </>
                  ) : (
                    <>
                      <TextInput
                        label="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        mode="outlined"
                        keyboardType="numeric"
                        maxLength={6}
                        style={styles.input}
                      />
                      <Button
                        mode="contained"
                        onPress={handleOTPConfirmation}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                      >
                        Verify OTP
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => {
                          setConfirmation(null);
                          setOtp('');
                        }}
                        style={styles.textButton}
                      >
                        Use Different Number
                      </Button>
                    </>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          <View style={styles.signupContainer}>
            <Text variant="bodyMedium">Don't have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signupButton}
            >
              Sign Up
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  card: {
    marginBottom: 24,
    elevation: 4,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signupButton: {
    marginLeft: -8,
  },
});

export default LoginScreen;
