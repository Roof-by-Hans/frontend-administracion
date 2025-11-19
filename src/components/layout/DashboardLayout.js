import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Modal,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children, userName, onLogout, onNavigate, currentScreen }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const isTablet = width >= 900 && width < 1200;
  // const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;
  const overlayWidth = useMemo(() => Math.min(Math.max(width * 0.75, 240), 320), [width]);

  const openMenu = useCallback(() => {
    setIsMenuVisible(true);
    animationValue.stopAnimation(() => {
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [animationValue]);

  const closeMenu = useCallback(
    (onFinished) => {
      animationValue.stopAnimation(() => {
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setIsMenuVisible(false);
          }
          if (onFinished) {
            onFinished();
          }
        });
      });
    },
    [animationValue]
  );

  const handleToggleMenu = useCallback(() => {
    if (isMenuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [closeMenu, isMenuVisible, openMenu]);

  const handleCloseMenu = useCallback(() => {
    if (isMenuVisible) {
      closeMenu();
    }
  }, [closeMenu, isMenuVisible]);

  useEffect(() => {
    if (!isCompact && isMenuVisible) {
      closeMenu();
    }
  }, [closeMenu, isCompact, isMenuVisible]);

  const backdropOpacity = animationValue;
  const sidebarTranslate = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-overlayWidth, 0],
  });

  const handleLogoutRequest = useCallback(() => {
    const revealPrompt = () => setShowLogoutPrompt(true);
    if (isCompact && isMenuVisible) {
      closeMenu(revealPrompt);
    } else {
      revealPrompt();
    }
  }, [closeMenu, isCompact, isMenuVisible]);

  const handleConfirmLogout = useCallback(() => {
    setShowLogoutPrompt(false);
    onLogout?.();
  }, [onLogout]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutPrompt(false);
  }, []);

  return (
    <View style={[styles.safeArea]}>
      <View style={[styles.root, isCompact && styles.rootCompact]}>
      {!isCompact && (
        <View style={styles.sidebarWrapper}>
          <Sidebar onLogout={handleLogoutRequest} onNavigate={onNavigate} currentScreen={currentScreen} />
        </View>
      )}
      <View style={styles.mainArea}>
        <Topbar
          userName={userName}
          onLogout={handleLogoutRequest}
          showMenuButton={isCompact}
          onMenuPress={handleToggleMenu}
        />
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <View style={[styles.content, isTablet && styles.contentTablet, isCompact && styles.contentCompact]}>
              {children}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      {isCompact && isMenuVisible && (
        <View style={styles.sidebarOverlay} pointerEvents="box-none">
          <Animated.View
            pointerEvents="none"
            style={[styles.overlayBackdrop, { opacity: backdropOpacity }]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseMenu} />
          <Animated.View
            style={[
              styles.overlaySidebar,
              {
                width: overlayWidth,
                transform: [{ translateX: sidebarTranslate }],
              },
            ]}
          >
            <Sidebar showCloseButton onClose={handleCloseMenu} onLogout={handleLogoutRequest} onNavigate={onNavigate} currentScreen={currentScreen} />
          </Animated.View>
        </View>
      )}
      <LogoutPrompt
        visible={showLogoutPrompt}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
      </View>
    </View>
  );
}

function LogoutPrompt({ visible, onCancel, onConfirm }) {
  const scaleValue = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      scaleValue.setValue(0.95);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleValue, visible]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.alertBackdrop}>
        <Animated.View style={[styles.alertCard, { transform: [{ scale: scaleValue }] }]}> 
          <View style={styles.alertIconWrapper}>
            <MaterialCommunityIcons name="account-circle" size={36} color="#4a4a4a" />
          </View>
          <Text style={styles.alertTitle}>¿Cerrar sesión?</Text>
          <Text style={styles.alertMessage}>
            Tu sesión se cerrará y tendrás que volver a iniciar sesión para acceder nuevamente.
          </Text>
          <View style={styles.alertActions}>
            <TouchableOpacity style={styles.alertSecondaryButton} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.alertSecondaryText} numberOfLines={1}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertPrimaryButton} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.alertPrimaryText} numberOfLines={1}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  rootCompact: {
    flexDirection: "column",
  },
  sidebarWrapper: {
    maxWidth: 260,
    width: "100%",
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    minWidth: 800,
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 28,
    backgroundColor: "#f5f5f5",
  },
  contentTablet: {
    paddingTop: 36,
  },
  contentCompact: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 28,
  },
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  overlaySidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#f1f1f1",
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  alertBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  alertIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f1f1f",
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#4a4a4a",
    textAlign: "center",
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  alertSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d6d6d6",
    backgroundColor: "#f7f7f7",
  },
  alertSecondaryText: {
    textAlign: "center",
    color: "#4d4d4d",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  alertPrimaryButton: {
    flex: 1.25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#4f4f4f",
    borderWidth: 1,
    borderColor: "#3f3f3f",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  alertPrimaryText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
