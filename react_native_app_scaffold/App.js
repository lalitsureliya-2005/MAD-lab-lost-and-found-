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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
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
            options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
          />
          <Stack.Screen 
            name="ReportForm" 
            component={ReportFormScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
