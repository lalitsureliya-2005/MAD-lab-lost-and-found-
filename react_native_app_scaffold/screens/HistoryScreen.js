import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, Animated } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import API_URL from '../config';
import { useTheme } from '../ThemeContext';

const HistoryCard = ({ item, index, theme }) => {
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(30)).current;
  const scaleValue = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeValue, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideValue, { toValue: 0, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1, friction: 7, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const s = getStyles(theme);

  return (
    <Animated.View style={{ opacity: fadeValue, transform: [{ translateY: slideValue }, { scale: scaleValue }] }}>
      <View style={s.card3DWrap}>
        <LinearGradient 
          colors={theme.gradientCardGreen} 
          style={s.historyCard}
        >
          {/* Header row */}
          <View style={s.cardHeader}>
            <View style={s.typeBadgeResolved}>
              <Text style={s.typeBadgeText}>✅ RESOLVED</Text>
            </View>
            <Text style={s.dateText}>{dateStr}</Text>
          </View>

          {/* Item name */}
          <Text style={s.itemName}>✨ {item.itemName}</Text>

          {/* Founder & Receiver - unified view */}
          <View style={s.transactionBlock}>
            <View style={s.transactionRow}>
              <View style={s.roleTag}>
                <Text style={s.roleTagText}>FOUND BY</Text>
              </View>
              <Text style={s.emailText} numberOfLines={1}>{item.founderEmail}</Text>
            </View>
            
            <View style={s.arrowContainer}>
              <Text style={s.arrowText}>↓  handed over to</Text>
            </View>

            <View style={s.transactionRow}>
              <View style={[s.roleTag, s.roleTagReceiver]}>
                <Text style={[s.roleTagText, s.roleTagReceiverText]}>RETURNED TO</Text>
              </View>
              <Text style={s.emailText} numberOfLines={1}>{item.receiverEmail}</Text>
            </View>
          </View>

          {/* Acknowledgement from receiver to founder */}
          {item.thankYouMessage ? (
            <View style={s.thankYouBlock}>
              <Text style={s.thankYouLabel}>💬 Acknowledgement to the Finder</Text>
              <Text style={s.thankYouText}>"{item.thankYouMessage}"</Text>
              <Text style={s.thankYouFrom}>— sent by {item.receiverEmail} to {item.founderEmail}</Text>
            </View>
          ) : (
            <View style={s.settledBadge}>
              <Text style={s.settledBadgeText}>Settled ✓</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export default function HistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    fetchHistory();
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/settlements/all`);
      setSettlements(response.data);
    } catch (error) {
      console.log('Fetch history error:', error.message);
      // Fallback to recent if /all doesn't exist yet
      try {
        const fallback = await axios.get(`${API_URL}/items/settlements/recent`);
        setSettlements(fallback.data);
      } catch (e) {
        console.log('Fallback also failed:', e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <Animated.View style={[s.glowOrb, { opacity: theme.glowOpacity }]} />

      {/* Header — Fixed: back button on its own row, title below to prevent overlap */}
      <Animated.View style={[s.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={s.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>⬅ Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.headerTitle}>Settlement History</Text>
      </Animated.View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.statCard3D}>
          <LinearGradient colors={theme.gradientCardGreen} style={s.statItem}>
            <Text style={s.statNumber}>{settlements.length}</Text>
            <Text style={s.statLabel}>Total Resolved</Text>
          </LinearGradient>
        </View>
      </View>

      {isLoading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.green} />
        </View>
      ) : (
        <FlatList
          data={settlements}
          renderItem={({ item, index }) => <HistoryCard item={item} index={index} theme={theme} />}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={s.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No History Yet</Text>
              <Text style={s.emptySubtitle}>Resolved items will appear here once settlements are made.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (t) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  glowOrb: { position: 'absolute', width: 300, height: 300, backgroundColor: t.green, borderRadius: 150, top: -120, right: -80 },
  
  // Header — FIXED: stacked layout prevents overlap
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: t.greenBorder },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { backgroundColor: t.greenSoft, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: t.greenBorder },
  backBtnText: { color: t.green, fontWeight: '900', fontSize: 13 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: t.textPrimary, letterSpacing: 1.5, fontFamily: 'serif', fontStyle: 'italic' },

  // Stats
  statsBar: { paddingHorizontal: 20, paddingVertical: 15 },
  statCard3D: { borderRadius: 16, ...t.cardShadow },
  statItem: { padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.greenBorder },
  statNumber: { color: t.green, fontSize: 28, fontWeight: '900', marginRight: 12 },
  statLabel: { color: t.textSecondary, fontSize: 14, fontWeight: '700' },

  listContainer: { padding: 20, paddingBottom: 100 },
  
  // Cards — 3D effect
  card3DWrap: { marginBottom: 18, borderRadius: 20, ...t.cardShadow },
  historyCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: t.greenBorder },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  typeBadgeResolved: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: t.greenSoft },
  typeBadgeText: { color: t.green, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  dateText: { color: t.textMuted, fontSize: 12, fontWeight: '600' },
  
  itemName: { color: t.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 18, letterSpacing: 0.5 },
  
  transactionBlock: { backgroundColor: t.name === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.04)', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: t.greenSoft },
  transactionRow: { flexDirection: 'row', alignItems: 'center' },
  roleTag: { backgroundColor: t.cyanSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: t.cyanBorder },
  roleTagText: { color: t.cyan, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  roleTagReceiver: { backgroundColor: t.greenSoft, borderColor: t.greenBorder },
  roleTagReceiverText: { color: t.green },
  emailText: { color: t.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 },
  arrowContainer: { alignItems: 'center', paddingVertical: 6 },
  arrowText: { color: t.textMuted, fontSize: 13, fontWeight: '700', fontStyle: 'italic' },
  
  thankYouBlock: { backgroundColor: t.bgGlass, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.cyanBorder },
  thankYouLabel: { color: t.textSecondary, fontWeight: '700', fontSize: 11, marginBottom: 6, letterSpacing: 0.5 },
  thankYouText: { color: t.cyan, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  thankYouFrom: { color: t.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 8 },
  
  settledBadge: { backgroundColor: t.greenSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: t.greenBorder },
  settledBadgeText: { color: t.green, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 28, fontWeight: '900', color: t.textPrimary, letterSpacing: 1 },
  emptySubtitle: { color: t.textMuted, marginTop: 10, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
});
