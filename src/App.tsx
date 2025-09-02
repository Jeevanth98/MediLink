import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { ReminderService } from './services/ReminderService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize notification system when app starts
    ReminderService.initializeNotifications();
  }, []);

  return <AppNavigator />;
}

export default App;
