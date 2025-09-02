import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/SimpleAuthContext';
import { FamilyProvider } from '../contexts/FamilyContext';
import { RecordProvider } from '../contexts/RecordContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MedicalRecordsScreen from '../screens/records/MedicalRecordsScreen';
import UploadDocumentScreen from '../screens/records/UploadDocumentScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import AIReportsScreen from '../screens/reports/AIReportsScreen';
import RemindersScreen from '../screens/reminders/RemindersScreen';
import AddMedicineReminderScreen from '../screens/reminders/AddMedicineReminderScreen';
import AddAppointmentReminderScreen from '../screens/reminders/AddAppointmentReminderScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import AddEmergencyContactScreen from '../screens/emergency/AddEmergencyContactScreen';
import EditEmergencyHealthScreen from '../screens/emergency/EditEmergencyHealthScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  AddFamilyMember: undefined;
  EditFamilyMember: { memberId: string };
  FamilyProfile: { memberId: string };
  UploadDocument: undefined;
  RecordDetails: { recordId: string };
  AddMedicineReminder: undefined;
  AddAppointmentReminder: undefined;
  AddEmergencyContact: undefined;
  EditEmergencyContact: { contactId: string };
  EditEmergencyHealth: { memberId: string };
};

export type TabParamList = {
  Home: undefined;
  Records: undefined;
  Reports: undefined;
  Reminders: undefined;
  Emergency: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Simple icon component using View
const Icon = ({ size, color }: { name: string; size: number; color: string }) => (
  <View style={{ 
    width: size, 
    height: size, 
    backgroundColor: color, 
    borderRadius: size/2 
  }} />
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: '#666',
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="home" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Records" 
      component={MedicalRecordsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="folder-medical" size={size} color={color} />
        ),
        title: 'Medical Records',
      }}
    />
    <Tab.Screen 
      name="Reports" 
      component={AIReportsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="chart-line" size={size} color={color} />
        ),
        title: 'AI Reports',
      }}
    />
    <Tab.Screen 
      name="Reminders" 
      component={RemindersScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="bell" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Emergency" 
      component={EmergencyScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="medical-bag" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Login"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <FamilyProvider>
    <RecordProvider>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UploadDocument" 
          component={UploadDocumentScreen}
          options={{ 
            title: 'Upload Document',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddFamilyMember" 
          component={AddFamilyMemberScreen}
          options={{ 
            title: 'Add Family Member',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddMedicineReminder" 
          component={AddMedicineReminderScreen}
          options={{ 
            title: 'Add Medicine Reminder',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddAppointmentReminder" 
          component={AddAppointmentReminderScreen}
          options={{ 
            title: 'Add Appointment Reminder',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="AddEmergencyContact" 
          component={AddEmergencyContactScreen}
          options={{ 
            title: 'Add Emergency Contact',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="EditEmergencyHealth" 
          component={EditEmergencyHealthScreen}
          options={{ 
            title: 'Emergency Health Info',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </RecordProvider>
  </FamilyProvider>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <MainStack /> : <AuthStack />;
};

const App = () => {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
