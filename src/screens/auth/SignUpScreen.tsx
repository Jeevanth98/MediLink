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
  Checkbox,
} from 'react-native-paper';
import { useAuth } from '../../contexts/SimpleAuthContext';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver' | 'admin'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const validatePassword = (passwordValue: string) => {
    return passwordValue.length >= 6;
  };

  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username, role);
      Alert.alert(
        'Account Created',
        `Welcome ${username}! Your account has been created successfully.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during registration');
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
            Create Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Join MediLink today
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Account Type
              </Text>
              <SegmentedButtons
                value={role}
                onValueChange={(value) => setRole(value as 'patient' | 'caregiver' | 'admin')}
                buttons={[
                  { value: 'patient', label: 'Patient' },
                  { value: 'caregiver', label: 'Caregiver' },
                ]}
                style={styles.segmentedButtons}
              />

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
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  autoCapitalize="none"
                  style={styles.input}
                  error={username !== '' && username.length < 3}
                />
                <HelperText type="error" visible={username !== '' && username.length < 3}>
                  Username must be at least 3 characters long
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
                  error={password !== '' && !validatePassword(password)}
                />
                <HelperText type="error" visible={password !== '' && !validatePassword(password)}>
                  Password must be at least 6 characters long
                </HelperText>

                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                  style={styles.input}
                  error={confirmPassword !== '' && password !== confirmPassword}
                />
                <HelperText type="error" visible={confirmPassword !== '' && password !== confirmPassword}>
                  Passwords do not match
                </HelperText>

                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={agreeToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                  />
                  <Text variant="bodyMedium" style={styles.checkboxText}>
                    I agree to the{' '}
                    <Text style={styles.link} onPress={() => {}}>
                      Terms and Conditions
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.link} onPress={() => {}}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Create Account
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.signinContainer}>
            <Text variant="bodyMedium">Already have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.signinButton}
            >
              Sign In
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
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
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
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  formContainer: {
    gap: 8,
  },
  input: {
    marginBottom: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signinButton: {
    marginLeft: -8,
  },
});

export default SignUpScreen;
