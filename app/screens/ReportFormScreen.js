import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, TouchableOpacity, StatusBar, Animated } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import API_URL from '../config';
import { useTheme } from '../ThemeContext';

export default function ReportFormScreen({ navigation }) {
  const { theme } = useTheme();
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('Main Block');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Expo Push Notifications are disabled while testing within Expo Go due to SDK 53+ limitations.
  const [expoToken, setExpoToken] = useState(null);

  const categories = ['Electronics', 'Books', 'Keys', 'Wallets', 'Others'];
  const locations = ['Main Block', 'Library', 'Canteen', 'Lab', 'Outdoors'];

  // Staggered entrance animations
  const anims = useRef(Array.from({ length: 8 }, () => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(25),
  }))).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 400, delay: i * 70, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 400, delay: i * 70, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const pickFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera access is needed to photograph the found item.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Gallery access is needed to select a photo of the lost item.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickImage = () => {
    if (type === 'lost') {
      pickFromGallery();
    } else {
      pickFromCamera();
    }
  };

  const submitReport = async () => {
    if (type === 'found' && !imageUri) {
      Alert.alert('Validation Error', 'A photo is currently required when reporting a found item.');
      return;
    }
    if (!title || !description || !reporterEmail || !reporterPhone) {
      Alert.alert('Validation Error', 'Please fill out all textual fields!');
      return;
    }

    setIsLoading(true);
    try {
      let response;

      if (imageUri) {
        // Use native fetch for multipart/form-data — axios has a known bug
        // on React Native where it can't properly handle FormData file uploads.
        const bodyData = new FormData();
        bodyData.append('title', title);
        bodyData.append('description', description);
        bodyData.append('category', category);
        bodyData.append('type', type);
        bodyData.append('location', location);
        bodyData.append('reporterEmail', reporterEmail);
        bodyData.append('reporterPhone', reporterPhone);
        if (expoToken) bodyData.append('expoPushToken', expoToken);

        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : `image/jpeg`;
        bodyData.append('image', { uri: imageUri, name: filename, type: fileType });

        // fetch() correctly sets multipart boundary automatically
        const rawResponse = await fetch(`${API_URL}/items`, {
          method: 'POST',
          body: bodyData,
          // Do NOT set Content-Type here — fetch sets it with the correct boundary
        });

        if (rawResponse.ok) {
          Alert.alert('Success', `${type.toUpperCase()} Report Created!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          const errData = await rawResponse.json();
          throw new Error(errData.message || `Server error ${rawResponse.status}`);
        }
      } else {
        // No image: plain JSON via axios works fine
        response = await axios.post(`${API_URL}/items`, {
          title, description, category, type, location,
          reporterEmail, reporterPhone, expoPushToken: expoToken
        });

        if (response.status === 201) {
          Alert.alert('Success', `${type.toUpperCase()} Report Created!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error('[Submit Report Error]', errMsg, error.response?.data);
      Alert.alert('Error', `Failed to submit report: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTagSelector = (items, selectedVal, setVal) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagContainer}>
      {items.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={[s.tag, selectedVal === item && s.tagSelected]}
          onPress={() => setVal(item)}
          activeOpacity={0.7}
        >
          <Text style={[s.tagText, selectedVal === item && s.tagTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const animStyle = (i) => ({
    opacity: anims[i].opacity,
    transform: [{ translateY: anims[i].translateY }],
  });

  const s = getStyles(theme);

  return (
    <View style={s.outerContainer}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      
      {/* Custom Nav Header */}
      <View style={s.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Create Report</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView style={s.container} contentContainerStyle={{paddingBottom: 50}}>
        
        <Animated.View style={animStyle(0)}>
          <View style={s.typeSelector}>
            <TouchableOpacity style={[s.typeBtn, type==='lost' ? s.typeBtnSelectedLost : null]} onPress={()=>setType('lost')} activeOpacity={0.7}>
              <Text style={[s.typeText, type==='lost' ? s.typeTextSelected : null]}>I LOST IT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.typeBtn, type==='found' ? s.typeBtnSelectedFound : null]} onPress={()=>setType('found')} activeOpacity={0.7}>
              <Text style={[s.typeText, type==='found' ? s.typeTextSelected : null]}>I FOUND IT</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={animStyle(1)}>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Blue Backpack" placeholderTextColor={theme.textMuted} />
        </Animated.View>

        <Animated.View style={animStyle(2)}>
          <Text style={s.label}>Description</Text>
          <TextInput style={s.input} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholderTextColor={theme.textMuted} />
        </Animated.View>

        <Animated.View style={animStyle(3)}>
          <Text style={s.label}>Category</Text>
          {renderTagSelector(categories, category, setCategory)}
        </Animated.View>

        <Animated.View style={animStyle(4)}>
          <Text style={s.label}>Location Mapping</Text>
          {renderTagSelector(locations, location, setLocation)}
        </Animated.View>

        <Animated.View style={animStyle(5)}>
          <Text style={s.label}>Reporter Email</Text>
          <TextInput style={s.input} value={reporterEmail} onChangeText={setReporterEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.textMuted} />
        </Animated.View>

        <Animated.View style={animStyle(6)}>
          <Text style={s.label}>Reporter Phone</Text>
          <TextInput style={s.input} value={reporterPhone} onChangeText={setReporterPhone} keyboardType="phone-pad" placeholderTextColor={theme.textMuted} />
        </Animated.View>

        <Animated.View style={animStyle(7)}>
          <View style={s.imageSection}>
            <LinearGradient colors={theme.name === 'dark' ? ['rgba(14, 165, 233, 0.05)', 'rgba(14, 165, 233, 0.02)'] : ['rgba(14, 165, 233, 0.03)', 'rgba(255,255,255,0.8)']} style={s.imageSectionGrad}>
              <Text style={s.labelNeon}>Snap a Photo {type === 'found' ? '(Required)' : '(Optional)'}</Text>
              <TouchableOpacity style={s.cameraBtn} onPress={pickImage} activeOpacity={0.7}>
                <Text style={s.cameraBtnText}>{type === 'lost' ? '🖼️ Select from Gallery' : '📷 Open Camera'}</Text>
              </TouchableOpacity>
              {imageUri && (
                <View style={s.imageBorderWrap}>
                   <Image source={{ uri: imageUri }} style={s.previewImage} />
                </View>
              )}
            </LinearGradient>
          </View>

          <View style={s.submitSection}>
            {isLoading ? <ActivityIndicator size="large" color={theme.accent} /> : (
              <TouchableOpacity onPress={submitReport} activeOpacity={0.8}>
                <LinearGradient colors={theme.gradientAccent} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={s.submitBtn}>
                    <Text style={s.submitBtnText}>Submit Report ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: t.bg },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: t.accentBorder },
  backBtn: { backgroundColor: t.accentSoft, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: t.accentBorder },
  backBtnText: { color: t.accent, fontWeight: '900', fontSize: 13 },
  navTitle: { fontSize: 22, fontWeight: '900', color: t.textPrimary, letterSpacing: 1.5, fontFamily: 'serif', fontStyle: 'italic' },

  container: { flex: 1, padding: 20 },
  typeSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.surfaceBorder, backgroundColor: t.surface, ...t.cardShadow3D },
  typeBtn: { flex: 1, padding: 18, alignItems: 'center' },
  typeBtnSelectedLost: { backgroundColor: t.redSoft },
  typeBtnSelectedFound: { backgroundColor: t.accentSoft },
  typeText: { fontWeight: '900', color: t.textMuted, letterSpacing: 1 },
  typeTextSelected: { color: t.textPrimary },
  label: { fontWeight: '800', marginBottom: 8, marginTop: 15, color: t.textSecondary, letterSpacing: 0.5 },
  labelNeon: { fontWeight: '800', marginBottom: 15, color: t.textPrimary, letterSpacing: 0.5 },
  input: { backgroundColor: t.bgInput, borderWidth: 1, borderColor: t.surfaceBorder, borderRadius: 14, padding: 16, color: t.textPrimary, fontSize: 16, ...t.cardShadow3D },
  tagContainer: { flexDirection: 'row', paddingVertical: 5 },
  tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: t.bgGlass, marginRight: 10, borderWidth: 1, borderColor: t.surfaceBorder },
  tagSelected: { backgroundColor: t.accent, borderColor: t.accent },
  tagText: { color: t.textMuted, fontWeight: 'bold' },
  tagTextSelected: { color: '#fff' },
  imageSection: { marginTop: 30, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.accentBorder, ...t.cardShadow },
  imageSectionGrad: { padding: 20 },
  cameraBtn: { backgroundColor: 'transparent', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: t.accent, borderStyle: 'dotted' },
  cameraBtnText: { color: t.accent, fontWeight: '900', fontSize: 16 },
  imageBorderWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: t.accentBorder, marginTop: 20 },
  previewImage: { width: '100%', height: 220, resizeMode: 'cover' },
  submitSection: { marginTop: 40 },
  submitBtn: { padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: t.shadowAccent, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
});
