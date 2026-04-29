import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from './ThemeContext';

import DashboardScreen from './screens/DashboardScreen';
import ReportFormScreen from './screens/ReportFormScreen';
import HistoryScreen from './screens/HistoryScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

import * as Device from 'expo-device';

// ... (keep existing setNotificationHandler) ...

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: '92559d72-1a21-43c0-966e-da3d4d938793',
    })).data;
    console.log('[App] Push Token:', token);
  }
  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = React.useState('');

  React.useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
          />
          <Stack.Screen name="ReportForm">
            {(props) => <ReportFormScreen {...props} expoPushToken={expoPushToken} />}
          </Stack.Screen>
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
