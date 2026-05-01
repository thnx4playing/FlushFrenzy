// src/components/WebViewModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  AppState,
  AppStateStatus,
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
  // Track AppState so we can render a privacy cover during 'inactive' /
  // 'background'. iOS captures the App Switcher snapshot during the
  // 'inactive' state — without a cover, the snapshot shows the page
  // contents, leaving them visible in the multitasking preview after the
  // user has swiped away. The cover hides the page in the snapshot.
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active'
  );
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => setAppActive(next === 'active')
    );
    return () => sub.remove();
  }, []);

  // Allow rotation while the modal is open. Use lockPlatformAsync with an
  // explicit iOS orientation array — more reliable than unlockAsync() on
  // iOS 16+ (known interaction issue with react-native-screens). The host
  // app is portrait by default; the modal is content-agnostic and lets
  // iOS respond to the user's physical phone orientation. On close,
  // restore PORTRAIT_UP. No URL inspection — modal only knows its own
  // visible state.
  useEffect(() => {
    if (!visible) return;
    ScreenOrientation.lockPlatformAsync({
      screenOrientationArrayIOS: [
        ScreenOrientation.Orientation.PORTRAIT_UP,
        ScreenOrientation.Orientation.LANDSCAPE_LEFT,
        ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ],
    }).catch(() => {});
    return () => {
      ScreenOrientation.lockPlatformAsync({
        screenOrientationArrayIOS: [ScreenOrientation.Orientation.PORTRAIT_UP],
      }).catch(() => {});
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
      // React Native's Modal defaults to portrait-only on iOS regardless
      // of the app's plist or expo-screen-orientation calls. Explicitly
      // declare the orientations this modal supports so iOS allows the
      // modal's view controller to rotate.
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
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
        {/* Privacy cover for the iOS App Switcher snapshot. Shown whenever
            the app isn't 'active' — Face ID prompts, Control Center,
            multitasking gesture, app switching, etc. iOS captures the
            multitasking snapshot during 'inactive' so the cover ends up
            in the preview rather than the WebView contents. Pre-mounted
            and toggled via opacity for the fastest possible reveal so
            the snapshot reliably catches it. */}
        <View
          style={[
            styles.privacyCover,
            { opacity: appActive ? 0 : 1 },
          ]}
          pointerEvents={appActive ? 'none' : 'auto'}
        />
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
  privacyCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1628',
  },
});
export default WebViewModal;
