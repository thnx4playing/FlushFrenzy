/**
 * LeaderboardModal.tsx
 * 
 * Classic arcade-style leaderboard display with scrollable high scores.
 * Features smooth animations, pull-to-refresh, and rank highlighting.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getLeaderboard, LeaderboardError } from './leaderboardApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LeaderboardEntry = {
  rank: number;
  initials: string;
  score: number;
  round: number | null;
  timestamp: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  gameMode: 'quick-flush' | 'endless-plunge';
  highlightRank?: number; // Optional rank to highlight (e.g., player's rank)
};

// Rank medal colors
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return { color: '#FFD700', icon: 'trophy' as const, bg: 'rgba(255, 215, 0, 0.2)' };
    case 2:
      return { color: '#C0C0C0', icon: 'medal' as const, bg: 'rgba(192, 192, 192, 0.2)' };
    case 3:
      return { color: '#CD7F32', icon: 'medal' as const, bg: 'rgba(205, 127, 50, 0.2)' };
    default:
      return { color: '#888', icon: null, bg: 'transparent' };
  }
};

// Single leaderboard row
function LeaderboardRow({
  entry,
  index,
  isHighlighted,
  gameMode,
}: {
  entry: LeaderboardEntry;
  index: number;
  isHighlighted: boolean;
  gameMode: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rankStyle = getRankStyle(entry.rank);
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50, // Stagger animation
      useNativeDriver: true,
    }).start();
  }, []);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: fadeAnim },
        { backgroundColor: rankStyle.bg },
        isHighlighted && styles.rowHighlighted,
      ]}
    >
      {/* Rank */}
      <View style={styles.rankCell}>
        {rankStyle.icon ? (
          <Ionicons name={rankStyle.icon} size={20} color={rankStyle.color} />
        ) : (
          <Text style={[styles.rankText, { color: rankStyle.color }]}>
            {entry.rank}
          </Text>
        )}
      </View>
      
      {/* Initials */}
      <View style={styles.initialsCell}>
        <Text style={[styles.initialsText, isHighlighted && styles.initialsHighlighted]}>
          {entry.initials}
        </Text>
      </View>
      
      {/* Score */}
      <View style={styles.scoreCell}>
        <Text style={[styles.scoreText, entry.rank <= 3 && { color: rankStyle.color }]}>
          {entry.score.toLocaleString()}
        </Text>
        {gameMode === 'endless-plunge' && entry.round && (
          <Text style={styles.roundBadge}>R{entry.round}</Text>
        )}
      </View>
      
      {/* Date */}
      <View style={styles.dateCell}>
        <Text style={styles.dateText}>{formatDate(entry.timestamp)}</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardModal({
  visible,
  onClose,
  gameMode,
  highlightRank,
}: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Fetch leaderboard data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const result = await getLeaderboard(gameMode, 100);
      setEntries(result.entries);
      
      // Scroll to highlighted rank after a short delay
      if (highlightRank && result.entries.length > 0) {
        const highlightIndex = result.entries.findIndex(e => e.rank === highlightRank);
        if (highlightIndex > 5) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.max(0, highlightIndex - 2),
              animated: true,
            });
          }, 500);
        }
      }
    } catch (err) {
      if (err instanceof LeaderboardError) {
        setError(err.message);
      } else {
        setError('Unable to load leaderboard');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [gameMode, highlightRank]);
  
  // Animate modal and fetch data when visible
  useEffect(() => {
    if (visible) {
      fetchData();
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);
  
  // Handle close with animation
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };
  
  // Pull to refresh
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchData(true);
  };
  
  const getGameModeTitle = () => {
    switch (gameMode) {
      case 'quick-flush':
        return 'QUICK FLUSH';
      case 'endless-plunge':
        return 'ENDLESS PLUNGE';
      default:
        return 'LEADERBOARD';
    }
  };
  
  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <LeaderboardRow
      entry={item}
      index={index}
      isHighlighted={highlightRank === item.rank}
      gameMode={gameMode}
    />
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color="#3D3D4D" />
      <Text style={styles.emptyText}>No scores yet!</Text>
      <Text style={styles.emptySubtext}>Be the first to claim the throne</Text>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={['#2D1B4E', '#1A0F2E']}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.headerTitle}>HIGH SCORES</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.gameModeTag}>
              <Text style={styles.gameModeText}>{getGameModeTitle()}</Text>
            </View>
          </LinearGradient>
          
          {/* Column headers */}
          <View style={styles.columnHeaders}>
            <View style={styles.rankCell}>
              <Text style={styles.columnHeader}>#</Text>
            </View>
            <View style={styles.initialsCell}>
              <Text style={styles.columnHeader}>NAME</Text>
            </View>
            <View style={styles.scoreCell}>
              <Text style={styles.columnHeader}>SCORE</Text>
            </View>
            <View style={styles.dateCell}>
              <Text style={styles.columnHeader}>DATE</Text>
            </View>
          </View>
          
          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading scores...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="cloud-offline" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={entries}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.rank}-${item.timestamp}`}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={entries.length === 0 ? styles.listEmpty : undefined}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#FFD700"
                  colors={['#FFD700']}
                />
              }
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                // Fallback for scroll to index failures
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                }, 100);
              }}
            />
          )}
          
          {/* Footer stats */}
          {!isLoading && !error && entries.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {entries.length} players on the board
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
  },
  closeButton: {
    padding: 4,
  },
  gameModeTag: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  gameModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowHighlighted: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  rankCell: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  initialsCell: {
    flex: 1,
    paddingLeft: 8,
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  initialsHighlighted: {
    color: '#4ECDC4',
    textShadowColor: '#4ECDC4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roundBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateCell: {
    width: 60,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  listEmpty: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
