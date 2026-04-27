// src/components/WebViewModal.tsx
import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
type Props = {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
  onActivity?: () => void;
};
const WebViewModal: React.FC<Props> = ({ visible, url, onClose, onActivity }) => {
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden animated />
      <View style={styles.container} onStartShouldSetResponderCapture={() => { onActivity?.(); return false; }}>
        {/* WebView — edge-to-edge, content goes behind the Dynamic Island.
            Page-side CSS uses env(safe-area-inset-top) to keep interactive
            UI clear of the island. */}
        <View style={[styles.webViewContainer, { marginBottom: -insets.bottom }]}>
          <WebView
            source={{ uri: url }}
            style={styles.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            // iOS: auto-grant camera/mic if the WebView URL is the same host
            // as the app's entitlement — no per-session prompt
            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            mediaPlaybackRequiresUserAction={false}
            // Android: auto-grant whatever resources the page requests
            onPermissionRequest={(request) => request.grant(request.resources)}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4DA8FF" />
            </View>
          )}
        </View>
        {/* Floating close button — sits below the Dynamic Island */}
        <TouchableOpacity
          onPress={onClose}
          style={[styles.floatingClose, { top: insets.top + 8 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingClose: {
    position: 'absolute',
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
});
export default WebViewModal;
