import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
export const isTablet = width >= 768;
export const isIPad = Platform.OS === 'ios' && isTablet;
export const isIPhone = Platform.OS === 'ios' && !isTablet;

// Responsive dimensions
export const screenWidth = width;
export const screenHeight = height;

// Responsive scaling factors
export const scaleX = width / 375; // iPhone base width
export const scaleY = height / 812; // iPhone base height
export const scale = Math.min(scaleX, scaleY);

// Responsive font sizes
export const fontScale = Math.min(scale, 1.2); // Cap font scaling at 1.2x

// Layout helpers
export const getResponsiveSize = (size) => {
  if (isTablet) {
    return size * 1.5; // 50% larger for tablets
  }
  return size;
};

export const getResponsivePadding = (padding) => {
  if (isTablet) {
    return padding * 1.8; // More padding for tablets
  }
  return padding;
};

export const getResponsiveMargin = (margin) => {
  if (isTablet) {
    return margin * 1.6; // More margin for tablets
  }
  return margin;
};

// Container width helpers
export const getContainerWidth = () => {
  if (isTablet) {
    return Math.min(width * 0.8, 600); // Max 600px width on tablets
  }
  return width;
};

export const getGameModeCardWidth = () => {
  if (isTablet) {
    return Math.min(width * 0.7, 500); // Smaller relative width on tablets
  }
  return width * 0.95;
};

export const getHeaderImageWidth = () => {
  if (isTablet) {
    return Math.min(width * 0.6, 400); // Smaller header on tablets
  }
  return width * 1.397;
};

export const getHeaderImageHeight = () => {
  if (isTablet) {
    return Math.min(height * 0.25, 200); // Smaller header height on tablets
  }
  return height * 0.466;
};

// Responsive styles
export const responsiveStyles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  content: {
    flex: 1,
    width: getContainerWidth(),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: 0,
  },
  
  gameModesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: isTablet ? 20 : 0,
  },
  
  gameModeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    width: getGameModeCardWidth(),
    height: isTablet ? 280 : 220,
    marginVertical: isTablet ? 15 : -10,
  },
  
  gameModeImage: {
    width: isTablet ? getGameModeCardWidth() * 0.8 : width * 0.765,
    height: isTablet ? 350 : 291.6,
    alignSelf: 'center',
  },
  
  headerImage: {
    width: getHeaderImageWidth(),
    height: getHeaderImageHeight(),
  },
  
  underHeaderImage: {
    width: isTablet ? Math.min(width * 0.5, 350) : width * 0.75,
    height: isTablet ? 150 : 120,
  },
};
