import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
              MediLink
            </Text>
            <Text style={[styles.headerSubtitle, {color: isDarkMode ? '#ccc' : '#666'}]}>
              Smart Medical Records Assistant
            </Text>
          </View>
          <View
            style={[
              styles.content,
              {
                backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
              },
            ]}>
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
                Welcome to MediLink
              </Text>
              <Text style={[styles.sectionDescription, {color: isDarkMode ? '#ccc' : '#666'}]}>
                Your smart medical record & report assistant that helps families securely store, 
                manage, and understand health records. Features include AI-powered lab report analysis, 
                medication reminders, and emergency health summaries.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
});

export default App;
