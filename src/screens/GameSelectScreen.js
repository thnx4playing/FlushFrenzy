import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const GAMES = [
  {
    id: 'toilet-paper-toss',
    title: 'Toilet Paper Toss',
    description: 'Aim and throw toilet paper rolls into the toilet!',
    icon: '🧻',
    difficulty: 'Easy',
    color: '#4ECDC4',
  },
  {
    id: 'plunger-push',
    title: 'Plunger Push',
    description: 'Test your strength with the mighty plunger!',
    icon: '🪠',
    difficulty: 'Medium',
    color: '#45B7D1',
  },
  {
    id: 'flush-rush',
    title: 'Flush Rush',
    description: 'Race against time to flush as many toilets as possible!',
    icon: '🚽',
    difficulty: 'Hard',
    color: '#96CEB4',
  },
  {
    id: 'soap-slide',
    title: 'Soap Slide',
    description: 'Navigate through slippery soap obstacles!',
    icon: '🧼',
    difficulty: 'Medium',
    color: '#FFEAA7',
  },
];

export default function GameSelectScreen({ navigation }) {
  const handleGameSelect = (gameId) => {
    navigation.navigate('Game', { gameId });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return '#2ECC71';
      case 'Medium':
        return '#F39C12';
      case 'Hard':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  const renderGameCard = (game) => (
    <TouchableOpacity
      key={game.id}
      style={[styles.gameCard, { backgroundColor: game.color }]}
      onPress={() => handleGameSelect(game.id)}
      activeOpacity={0.8}
    >
      <View style={styles.gameIcon}>
        <Text style={styles.gameIconText}>{game.icon}</Text>
      </View>
      
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle}>{game.title}</Text>
        <Text style={styles.gameDescription}>{game.description}</Text>
        
        <View style={styles.difficultyContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(game.difficulty) }]}>
            <Text style={styles.difficultyText}>{game.difficulty}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.playArrow}>
        <Text style={styles.playArrowText}>▶️</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Choose Your Challenge</Text>
        <Text style={styles.subtitle}>Pick a toilet Olympics event!</Text>
      </View>

      <ScrollView
        style={styles.gamesList}
        contentContainerStyle={styles.gamesListContent}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map(renderGameCard)}
        
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>🚧 More Games Coming Soon! 🚧</Text>
          <Text style={styles.comingSoonText}>
            Stay tuned for more hilarious toilet-themed challenges!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E86AB',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  gamesList: {
    flex: 1,
  },
  gamesListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  gameIconText: {
    fontSize: 30,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 10,
    lineHeight: 18,
  },
  difficultyContainer: {
    flexDirection: 'row',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  playArrow: {
    marginLeft: 10,
  },
  playArrowText: {
    fontSize: 24,
  },
  comingSoon: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#E8F4FD',
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B3D9F2',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#5A6C7D',
    textAlign: 'center',
    lineHeight: 18,
  },
});
