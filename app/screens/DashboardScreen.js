import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image, StatusBar, Modal, TextInput, Animated, ScrollView, Dimensions, Easing } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import API_URL from '../config';
import { useTheme } from '../ThemeContext';

const { width } = Dimensions.get('window');

const AnimatedCard = ({ item, index, openActionHub, theme }) => {
  const scaleValue = useRef(new Animated.Value(0.85)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, friction: 7, tension: 40, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacityValue, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [item]);

  const s = getStyles(theme);

  return (
    <Animated.View style={[s.cardWrapper, { opacity: opacityValue, transform: [{ scale: scaleValue }, { translateY: slideY }] }]}>
      <View style={s.card3DWrap}>
        <LinearGradient colors={theme.gradientCard} style={s.card}>
          
          <View style={[s.tagBadge, item.type === 'lost' ? s.tagBadgeLost : s.tagBadgeFound]}>
            <Text style={s.tagText}>{item.type.toUpperCase()}</Text>
          </View>

          {item.imageUrl ? (
            <View style={s.imageBorderWrap}>
              <Image source={{ uri: item.imageUrl }} style={s.cardImage} />
            </View>
          ) : (
            <View style={s.imageBorderWrap}>
              <LinearGradient colors={theme.name === 'dark' ? ['#020816', '#011224'] : ['#e2e8f0', '#f0f4f8']} style={s.placeholderImage}>
                <Text style={s.placeholderText}>NO PHOTO PROVIDED</Text>
              </LinearGradient>
            </View>
          )}

          <View style={s.cardBody}>
            <Text style={s.title}>{item.title || 'Untitled Report'}</Text>
            <Text style={s.description} numberOfLines={2}>{item.description}</Text>
            
            <View style={s.iconRow}>
              <View style={s.glassPill}><Text style={s.subtitle}>📌 {item.location || 'Unknown'}</Text></View>
              <View style={s.glassPill}><Text style={s.subtitle}>🏷️ {item.category}</Text></View>
            </View>

            <View style={s.footerRow}>
              <TouchableOpacity style={s.neonBtnWrapper} onPress={() => openActionHub(item)} activeOpacity={0.8}>
                <LinearGradient colors={theme.gradientAccent} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={s.neonBtn}>
                  <Text style={s.neonBtnText}>Connect & Resolve</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');
  
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resolverEmailInput, setResolverEmailInput] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Animations
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchItems();
    });
    fetchItems();
    
    // Header entrance
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // FAB pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(fabScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    Animated.spring(tabIndicator, {
      toValue: activeTab === 'lost' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/items`);
      setAllItems(response.data);
    } catch (error) {
      console.log('Fetch items error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = allItems.filter(
    item => item.type === activeTab && item.status === 'available'
  );

  const openActionHub = (item) => {
    setSelectedItem(item);
    setVerifyEmail('');
    setResolverEmailInput('');
    setThankYouMessage('');
    setActionModalVisible(true);
  };

  const handleResolve = async () => {
    if (!verifyEmail || !resolverEmailInput) {
      Alert.alert('Hold On', 'You must enter both your email and the original reporter\'s email to authorize this resolution.');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await axios.put(`${API_URL}/items/${selectedItem._id}/acknowledge`, { 
        verifyEmail,
        thankYouMessage,
        resolverEmail: resolverEmailInput
      });
      if (response.status === 200) {
        Alert.alert("Success! 🎉", "The item handshake is complete and resolved!");
        setActionModalVisible(false);
        fetchItems();
      }
    } catch (err) {
      Alert.alert("Authorization Failed", "The email you entered does not match the original creator of this post.");
    } finally {
      setIsVerifying(false);
    }
  };

  const lostCount = allItems.filter(i => i.type === 'lost' && i.status === 'available').length;
  const foundCount = allItems.filter(i => i.type === 'found' && i.status === 'available').length;

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      
      <Animated.View style={[s.glowOrbTop, { opacity: theme.glowOpacity }]} />
      
      {/* Header Area */}
      <Animated.View style={[s.header, { opacity: headerFade }]}>
        <View style={s.headerLeft}>
          <Text style={s.brandText}>BMSCE</Text>
          <Text style={s.dashboardTitle}>Dashboard</Text>
        </View>
        <View style={s.headerRight}>
          {/* Theme Toggle */}
          <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={s.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.historyBtn} onPress={() => navigation.navigate('History')} activeOpacity={0.8}>
            <Text style={s.historyBtnText}>📜 History</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tab Bar: LOST | + | FOUND */}
      <View style={s.tabBarContainer}>
        <TouchableOpacity 
          style={[s.tabItem, activeTab === 'lost' && s.tabItemActive]}
          onPress={() => setActiveTab('lost')}
          activeOpacity={0.7}
        >
          <Text style={s.tabEmoji}>🔴</Text>
          <Text style={[s.tabLabel, activeTab === 'lost' && s.tabLabelActive]}>LOST</Text>
          <View style={s.tabCount}>
            <Text style={s.tabCountText}>{lostCount}</Text>
          </View>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <TouchableOpacity 
            style={s.fabButton}
            onPress={() => navigation.navigate('ReportForm')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={theme.gradientAccent} style={s.fabGradient}>
              <Text style={s.fabText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          style={[s.tabItem, activeTab === 'found' && s.tabItemActive]}
          onPress={() => setActiveTab('found')}
          activeOpacity={0.7}
        >
          <Text style={s.tabEmoji}>🔵</Text>
          <Text style={[s.tabLabel, activeTab === 'found' && s.tabLabelActive]}>FOUND</Text>
          <View style={s.tabCount}>
            <Text style={s.tabCountText}>{foundCount}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={({ item, index }) => (
             <AnimatedCard item={item} index={index} openActionHub={openActionHub} theme={theme} />
          )}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={s.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
                <Text style={s.emptyIcon}>{activeTab === 'lost' ? '🔍' : '📦'}</Text>
                <Text style={s.emptyTitle}>No {activeTab === 'lost' ? 'Lost' : 'Found'} Reports</Text>
                <Text style={s.emptySubtitle}>
                  {activeTab === 'lost' 
                    ? 'No active lost item reports right now.' 
                    : 'No active found item reports right now.'}
                </Text>
            </View>
          }
        />
      )}

      {/* Action Hub Modal */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} style={{width: '100%'}}>
            <View style={s.modalCard3D}>
              <LinearGradient colors={theme.gradientModal} style={s.modalBox}>
                <Text style={s.modalHeader}>Verification Hub</Text>
                
                {selectedItem && (
                  <View style={s.contactCard}>
                    <Text style={s.contactTitle}>Contact the Reporter:</Text>
                    <Text style={s.contactDetail}>📧 {selectedItem.reporterEmail}</Text>
                    {selectedItem.reporterPhone ? <Text style={s.contactDetail}>📱 {selectedItem.reporterPhone}</Text> : null}
                    <Text style={s.contactHint}>Reach out to coordinate a secure meetup.</Text>
                  </View>
                )}

                <Text style={s.verifyLabel}>
                  {selectedItem?.type === 'found' 
                    ? '📧 Your Email (You are the owner who lost this item)' 
                    : '📧 Your Email (You found this item)'}
                </Text>
                <Text style={s.verifyHint}>
                  {selectedItem?.type === 'found'
                    ? 'Enter your email so the settlement record shows who received the item back.'
                    : 'Enter your email so the settlement record shows who found the item.'}
                </Text>
                <TextInput 
                  style={s.neoInput} 
                  placeholder="e.g. yourname@bmsce.ac.in" 
                  placeholderTextColor={theme.textMuted} 
                  value={resolverEmailInput}
                  onChangeText={setResolverEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={s.verifyLabel}>Optional: Thank You Note</Text>
                <Text style={s.verifyHint}>Leave a public acknowledgement for the other party!</Text>
                <TextInput 
                  style={s.neoInput} 
                  placeholder="e.g. Thanks so much for finding my keys!" 
                  placeholderTextColor={theme.textMuted} 
                  value={thankYouMessage}
                  onChangeText={setThankYouMessage}
                  multiline
                />

                <Text style={s.verifyLabel}>Finalize & Mark Resolved</Text>
                <Text style={s.verifyHint}>To formally close this case, paste the reporter's email exactly as shown above to verify authorization.</Text>
                <TextInput 
                  style={s.neoInput} 
                  placeholder="e.g. name@bmsce.ac.in" 
                  placeholderTextColor={theme.textMuted} 
                  value={verifyEmail}
                  onChangeText={setVerifyEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <View style={s.modalActions}>
                  <TouchableOpacity onPress={() => setActionModalVisible(false)} style={s.cancelBtn} activeOpacity={0.7}>
                    <Text style={s.cancelBtnText}>Abort</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={handleResolve} disabled={isVerifying} activeOpacity={0.8}>
                    <LinearGradient colors={theme.gradientAccent} style={s.verifyConfirmBtn}>
                      {isVerifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.verifyConfirmText}>Authorize ✓</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  glowOrbTop: { position: 'absolute', width: 350, height: 350, backgroundColor: t.glowColor, borderRadius: 175, top: -150, left: -100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 55, paddingBottom: 15, alignItems: 'center', backgroundColor: 'transparent', zIndex: 10, borderBottomWidth: 1, borderBottomColor: t.accentBorder },
  headerLeft: { flexDirection: 'column' },
  headerRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  brandText: { color: t.accent, fontFamily: 'serif', fontWeight: '900', fontSize: 30, letterSpacing: 5 },
  dashboardTitle: { color: t.textSecondary, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '700', fontSize: 17, marginTop: 3, letterSpacing: 2 },
  
  // Theme toggle
  themeToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accentSoft, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: t.accentBorder },
  themeIcon: { fontSize: 16 },

  historyBtn: { backgroundColor: t.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: t.accentBorder },
  historyBtnText: { color: t.accent, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  // Tab Bar
  tabBarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: t.accentBorder, backgroundColor: t.name === 'dark' ? 'rgba(2, 6, 23, 0.6)' : 'rgba(255,255,255,0.8)' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, marginHorizontal: 4 },
  tabItemActive: { backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accentBorder },
  tabEmoji: { fontSize: 14, marginRight: 6 },
  tabLabel: { color: t.textMuted, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  tabLabelActive: { color: t.textPrimary },
  tabCount: { backgroundColor: t.cyanSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  tabCountText: { color: t.accent, fontWeight: '900', fontSize: 11 },

  fabButton: { width: 52, height: 52, borderRadius: 26, shadowColor: t.shadowAccent, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10, marginHorizontal: 8 },
  fabGradient: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: -2 },

  // Cards
  listContainer: { padding: 15, paddingBottom: 100 },
  cardWrapper: { marginBottom: 30 },
  card3DWrap: { borderRadius: 24, ...t.cardShadow },
  card: { borderRadius: 24, padding: 15, overflow: 'hidden', borderWidth: 1, borderColor: t.surfaceBorder },
  
  tagBadge: { position: 'absolute', top: 25, left: 25, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 5 },
  tagBadgeLost: { backgroundColor: t.red },
  tagBadgeFound: { backgroundColor: t.accent },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  
  imageBorderWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.accentBorder, backgroundColor: t.surface },
  cardImage: { width: '100%', height: 260, resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: 260, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: t.accent, fontWeight: 'bold', letterSpacing: 1 },
  
  cardBody: { paddingVertical: 25, paddingHorizontal: 10 },
  title: { fontSize: 28, fontWeight: '900', color: t.textPrimary, marginBottom: 12, letterSpacing: 0.8 },
  description: { fontSize: 16, color: t.textSecondary, lineHeight: 22, marginBottom: 25 },
  
  iconRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 25 },
  glassPill: { backgroundColor: t.accentSoft, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: t.accentBorder, ...t.cardShadow3D },
  subtitle: { color: t.name === 'dark' ? '#cbd5e1' : '#475569', fontSize: 12, fontWeight: '700' },
  
  footerRow: { borderTopWidth: 1, borderTopColor: t.accentBorder, paddingTop: 25 },
  neonBtnWrapper: { borderRadius: 16, shadowColor: t.shadowAccent, shadowOpacity: 0.8, shadowRadius: 15, elevation: 5 },
  neonBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  neonBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 28, fontWeight: '900', color: t.textPrimary, letterSpacing: 1 },
  emptySubtitle: { color: t.textMuted, marginTop: 10, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalCard3D: { width: '90%', alignSelf: 'center', marginVertical: 40, borderRadius: 24, ...t.cardShadow },
  modalBox: { borderRadius: 24, padding: 30, borderWidth: 1, borderColor: t.accentBorder },
  modalHeader: { fontSize: 26, fontWeight: '900', color: t.textPrimary, marginBottom: 25 },
  contactCard: { backgroundColor: t.bgGlass, padding: 20, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: t.accentBorder },
  contactTitle: { color: t.cyan, fontWeight: 'bold', marginBottom: 12, fontSize: 16 },
  contactDetail: { color: t.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 6 },
  contactHint: { color: t.textSecondary, fontSize: 13, marginTop: 12 },
  verifyLabel: { color: t.textPrimary, fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  verifyHint: { color: t.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 20 },
  neoInput: { backgroundColor: t.bgInput, borderWidth: 1, borderColor: t.surfaceBorder, borderRadius: 14, padding: 18, color: t.textPrimary, fontSize: 16, marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
  cancelBtn: { marginRight: 25 },
  cancelBtnText: { color: t.textMuted, fontWeight: 'bold' },
  verifyConfirmBtn: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  verifyConfirmText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
