import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, StatusBar, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import API_URL from '../config';
import { useTheme } from '../ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowPulse = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.08, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
        console.log('Failed to get push token for push notification!');
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token (acts similarly to FCM token):', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }
    return token;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const expoPushToken = await registerForPushNotificationsAsync();

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        fcmToken: expoPushToken || "dummy_token_for_simulator"
      });

      await AsyncStorage.setItem('jwt', response.data.token);
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Login error', error.response?.data?.message || 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* Animated glow orbs */}
      <Animated.View style={[s.glowOrb1, { opacity: glowPulse }]} />
      <Animated.View style={[s.glowOrb2, { opacity: Animated.multiply(glowPulse, 0.7) }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>

          {/* Brand Header */}
          <View style={s.brandSection}>
            <Text style={s.brandLogo}>🔍</Text>
            <Text style={s.brandName}>BMSCE</Text>
            <View style={s.brandDivider} />
            <Text style={s.brandTagline}>Lost & Found</Text>
            <Text style={s.brandSubtext}>Campus Recovery System</Text>
          </View>

          {/* Login Card */}
          <View style={s.loginCard}>
            <LinearGradient
              colors={theme.name === 'dark' ? ['rgba(14,165,233,0.06)', 'rgba(2,6,23,0.8)'] : ['rgba(255,255,255,0.95)', 'rgba(240,244,248,0.9)']}
              style={s.cardGradient}
            >
              <Text style={s.cardTitle}>Welcome Back</Text>
              <Text style={s.cardSubtitle}>Sign in to continue</Text>

              {/* Email Input */}
              <View style={s.inputWrapper}>
                <Text style={s.inputIcon}>📧</Text>
                <TextInput
                  style={s.input}
                  placeholder="College Email"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Input */}
              <View style={s.inputWrapper}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={s.input}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Login Button */}
              {isLoading ? (
                <View style={s.loaderWrap}>
                  <ActivityIndicator size="large" color={theme.accent} />
                </View>
              ) : (
                <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
                  <LinearGradient colors={theme.gradientAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.loginBtn}>
                    <Text style={s.loginBtnText}>Sign In →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Skip */}
              <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={s.skipBtn}>
                <Text style={s.skipText}>Skip to Dashboard →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  glowOrb1: { position: 'absolute', width: 350, height: 350, backgroundColor: t.accent, borderRadius: 175, top: -100, right: -100 },
  glowOrb2: { position: 'absolute', width: 250, height: 250, backgroundColor: t.green, borderRadius: 125, bottom: -80, left: -60 },
  content: { paddingHorizontal: 24 },

  // Brand
  brandSection: { alignItems: 'center', marginBottom: 40 },
  brandLogo: { fontSize: 56, marginBottom: 16 },
  brandName: { fontSize: 36, fontWeight: '900', color: t.accent, letterSpacing: 6, fontFamily: 'serif' },
  brandDivider: { width: 40, height: 3, backgroundColor: t.accent, marginVertical: 12, borderRadius: 2 },
  brandTagline: { fontSize: 22, fontWeight: '800', color: t.textPrimary, letterSpacing: 2, fontFamily: 'serif', fontStyle: 'italic' },
  brandSubtext: { fontSize: 13, color: t.textMuted, marginTop: 8, letterSpacing: 1.5 },

  // Card
  loginCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: t.accentBorder, ...t.cardShadow },
  cardGradient: { padding: 28 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: t.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 28 },

  // Inputs
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgInput, borderWidth: 1, borderColor: t.surfaceBorder, borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, ...t.cardShadow3D },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, padding: 18, color: t.textPrimary, fontSize: 16 },

  // Button
  loginBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8, shadowColor: t.shadowAccent, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  loaderWrap: { paddingVertical: 20 },

  // Skip
  skipBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 10 },
  skipText: { color: t.textMuted, fontSize: 14, fontWeight: '600' },
});
