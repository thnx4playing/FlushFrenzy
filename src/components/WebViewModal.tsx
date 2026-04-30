// src/components/WebViewModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
type Props = {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
  onActivity?: () => void;
};
// onClose is still wired to the modal's onRequestClose so iOS gestures
// like minimizing the app dismiss it cleanly. There is no on-screen X
// because users return to the host app via the iOS app switcher.
const WebViewModal: React.FC<Props> = ({ visible, url, onClose, onActivity }) => {
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Allow rotation while the modal is open. The host app is portrait by
  // default; the modal is content-agnostic and just lets iOS respond to
  // the user's physical phone orientation while they're viewing web
  // content. On close, restore portrait so the rest of the app (game
  // screens, home) stays portrait. No URL inspection — the modal only
  // knows about its own visible state.
  useEffect(() => {
    if (!visible) return;
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
        .catch(() => {});
    };
  }, [visible]);

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
});
export default WebViewModal;
