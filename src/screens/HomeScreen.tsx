import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Avatar,
  Chip,
  Divider,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useFamily } from '../contexts/FamilyContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { members, selectedMember, selectMember, isLoading } = useFamily();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Avatar.Text 
                  size={60} 
                  label={user?.username ? getInitials(user.username) : 'U'} 
                  style={{ backgroundColor: '#2196F3' }}
                />
                <View style={styles.userDetails}>
                  <Text variant="headlineSmall" style={styles.welcomeText}>
                    Welcome back, {user?.username || 'User'}!
                  </Text>
                  <Text variant="bodyMedium" style={styles.emailText}>
                    {user?.email}
                  </Text>
                  <Chip mode="outlined" compact style={styles.roleChip}>
                    {user?.role || 'Patient'}
                  </Chip>
                </View>
              </View>
              <Button mode="outlined" onPress={handleSignOut} compact>
                Sign Out
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Family Members Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Family Members
            </Text>
            
            {isLoading ? (
              <Text variant="bodyMedium" style={styles.centerText}>
                Loading family members...
              </Text>
            ) : members.length > 0 ? (
              <View style={styles.membersContainer}>
                {members.map((member, index) => (
                  <View key={member.id}>
                    <View style={styles.memberRow}>
                      <Avatar.Text
                        size={40}
                        label={getInitials(member.name)}
                        style={{ backgroundColor: getAvatarColor(member.name) }}
                      />
                      <View style={styles.memberInfo}>
                        <Text variant="bodyLarge" style={styles.memberName}>
                          {member.name}
                          {member.isMainProfile && (
                            <Text style={styles.mainProfileBadge}> (You)</Text>
                          )}
                        </Text>
                        <Text variant="bodySmall" style={styles.memberDetails}>
                          {member.age} years • {member.gender} • {member.bloodGroup}
                        </Text>
                        {member.chronicConditions.length > 0 && (
                          <Text variant="bodySmall" style={styles.conditionsText}>
                            Conditions: {member.chronicConditions.join(', ')}
                          </Text>
                        )}
                      </View>
                      <Button
                        mode={selectedMember?.id === member.id ? 'contained' : 'outlined'}
                        compact
                        onPress={() => selectMember(member)}
                      >
                        {selectedMember?.id === member.id ? 'Selected' : 'Select'}
                      </Button>
                    </View>
                    {index < members.length - 1 && <Divider style={styles.divider} />}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No family members added yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Add your first family member to get started with MediLink
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Stats Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Overview
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {members.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Family Members
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Medical Records
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Medications
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Module Status Cards */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              MediLink Modules
            </Text>
            <View style={styles.modulesList}>
              <View style={styles.moduleItem}>
                <Text variant="bodyLarge">✅ User & Family Management</Text>
                <Text variant="bodySmall" style={styles.moduleStatus}>Active</Text>
              </View>
              <View style={styles.moduleItem}>
                <Text variant="bodyLarge">🔧 Medical Record Management</Text>
                <Text variant="bodySmall" style={styles.moduleStatus}>Coming Soon</Text>
              </View>
              <View style={styles.moduleItem}>
                <Text variant="bodyLarge">🤖 AI Lab Report Interpretation</Text>
                <Text variant="bodySmall" style={styles.moduleStatus}>Coming Soon</Text>
              </View>
              <View style={styles.moduleItem}>
                <Text variant="bodyLarge">💊 Medicine & Appointment Reminders</Text>
                <Text variant="bodySmall" style={styles.moduleStatus}>Coming Soon</Text>
              </View>
              <View style={styles.moduleItem}>
                <Text variant="bodyLarge">🚨 Emergency & Quick Access</Text>
                <Text variant="bodySmall" style={styles.moduleStatus}>Coming Soon</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddFamilyMember')}
        label="Add Member"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    color: '#666',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  centerText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  membersContainer: {
    gap: 0,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainProfileBadge: {
    color: '#2196F3',
    fontWeight: 'normal',
    fontSize: 12,
  },
  memberDetails: {
    color: '#666',
    marginBottom: 2,
  },
  conditionsText: {
    color: '#FF9800',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  modulesList: {
    gap: 12,
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  moduleStatus: {
    color: '#666',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default HomeScreen;
