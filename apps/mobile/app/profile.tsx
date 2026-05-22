import { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
  Vibration,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

import { useSettingsStore } from '../src/store/settings-store';
import { useAuthStore } from '../src/store/auth-store';
import { authApi } from '../src/lib/auth-api';

const playSoundEffect = async (resource: any) => {
  try {
    const { sound } = await Audio.Sound.createAsync(resource);
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
    await sound.playAsync();
  } catch {}
};

export default function ProfileScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  const { user, accessToken, updateUser, clearAuth } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isEn = settings.language === 'en';
  const t = {
    settings: isEn ? 'Settings' : 'Cài đặt',
    account: isEn ? 'Account' : 'Tài khoản',
    login: isEn ? 'Sign In' : 'Đăng nhập',
    register: isEn ? 'Sign Up' : 'Đăng ký',
    logout: isEn ? 'Sign Out' : 'Đăng xuất',
    changeAvatar: isEn ? 'Change Avatar' : 'Đổi ảnh đại diện',
    general: isEn ? 'General' : 'Chung',
    language: isEn ? 'English Interface' : 'Giao diện Tiếng Anh',
    haptic: isEn ? 'Vibration Feedback' : 'Rung Phản Hồi',
    sound: isEn ? 'App Sounds' : 'Âm Thanh Ứng Dụng',
    testHaptic: isEn ? 'Test Vibration' : 'Thử Rung',
    testSound: isEn ? 'Test Sound' : 'Thử Âm Thanh',
    accessibility: isEn ? 'Accessibility' : 'Trợ Năng',
    largeText: isEn ? 'Larger Text' : 'Chữ Lớn Hơn',
    reduceMotion: isEn ? 'Reduce Motion' : 'Giảm Chuyển Động',
    disableConfetti: isEn ? 'Disable Confetti' : 'Tắt Pháo Hoa',
    swipeMode: isEn ? 'Swipe Feature' : 'Tính năng Vuốt',
    version: 'Lắc Lắc v1.0.0',
  };

  const syncSetting = useCallback(
    async (update: Parameters<typeof authApi.updateSettings>[0]) => {
      if (!accessToken) return;
      try {
        await authApi.updateSettings(update, accessToken);
      } catch {}
    },
    [accessToken],
  );

  const handleChangeAvatar = async () => {
    if (!user || !accessToken) {
      Alert.alert(isEn ? 'Login required' : 'Cần đăng nhập', isEn ? 'Please sign in to change avatar' : 'Vui lòng đăng nhập để đổi ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setUploadingAvatar(true);
    try {
      const base64 = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType ?? 'image/jpeg';
      const baseApi = process.env.EXPO_PUBLIC_API_URL ?? 'https://fiwpr.id.vn/api/v1';
      const uploadRes = await fetch(`${baseApi}/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType, folder: 'avatars' }),
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const avatarUrl: string = uploadData.data?.url ?? uploadData.data?.secure_url;
      if (!avatarUrl) throw new Error('No URL returned');

      const updated = await authApi.updateAvatar(avatarUrl, accessToken);
      updateUser({ avatarUrl: updated.avatarUrl ?? null });
      Alert.alert(isEn ? 'Success' : 'Thành công', isEn ? 'Avatar updated!' : 'Đã cập nhật ảnh đại diện!');
    } catch (err: any) {
      Alert.alert(isEn ? 'Error' : 'Lỗi', err?.message ?? 'Cannot upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t.logout,
      isEn ? 'Are you sure?' : 'Bạn có chắc muốn đăng xuất?',
      [
        { text: isEn ? 'Cancel' : 'Hủy', style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            if (accessToken) {
              try { await authApi.logout(accessToken); } catch {}
            }
            clearAuth();
            router.replace('/');
          },
        },
      ],
    );
  };

  const toggleLanguage = async (v: boolean) => {
    const lang = v ? 'en' : 'vi';
    settings.setLanguage(lang);
    await syncSetting({ language: lang });
  };

  const toggleHaptic = async (v: boolean) => {
    settings.setHaptic(v);
    if (v) Vibration.vibrate(100);
    await syncSetting({ hapticEnabled: v });
  };

  const toggleSound = async (v: boolean) => {
    settings.setSound(v);
    await syncSetting({ soundEnabled: v });
  };

  const toggleReduceMotion = async (v: boolean) => {
    settings.setReduceMotion(v);
    await syncSetting({ reduceMotion: v });
  };

  const toggleConfetti = async (v: boolean) => {
    settings.setDisableConfetti(v);
    await syncSetting({ disableConfetti: v });
  };

  const toggleSwipeMode = async (v: boolean) => {
    settings.setSwipeModeEnabled(v);
    await syncSetting({ swipeModeEnabled: v });
  };

  const increaseTextScale = async () => {
    const next = Math.min(settings.textScale + 0.1, 1.5);
    settings.setTextScale(parseFloat(next.toFixed(1)));
    await syncSetting({ textScale: parseFloat(next.toFixed(1)) });
  };

  const decreaseTextScale = async () => {
    const next = Math.max(settings.textScale - 0.1, 0.8);
    settings.setTextScale(parseFloat(next.toFixed(1)));
    await syncSetting({ textScale: parseFloat(next.toFixed(1)) });
  };

  const baseFontSize = 15 * settings.textScale;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar + Account Card */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: 16 * settings.textScale }]}>{t.account}</Text>
          <View style={styles.avatarRow}>
            <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              <View style={styles.avatarWrap}>
                {uploadingAvatar ? (
                  <ActivityIndicator color="#E53935" />
                ) : user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person" size={40} color="#E53935" />
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color="#FFF" />
                </View>
              </View>
            </Pressable>
            <View style={styles.userInfoCol}>
              {user ? (
                <>
                  <Text style={[styles.userName, { fontSize: baseFontSize + 1 }]}>{user.name}</Text>
                  <Text style={[styles.userEmail, { fontSize: baseFontSize - 2 }]}>{user.email}</Text>
                  <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={14} color="#E53935" />
                    <Text style={[styles.logoutText, { fontSize: baseFontSize - 2 }]}>{t.logout}</Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.authBtns}>
                  <Pressable style={styles.loginBtn} onPress={() => router.push('/login')}>
                    <Text style={[styles.loginBtnText, { fontSize: baseFontSize - 1 }]}>{t.login}</Text>
                  </Pressable>
                  <Pressable style={styles.registerBtn} onPress={() => router.push('/register')}>
                    <Text style={[styles.registerBtnText, { fontSize: baseFontSize - 1 }]}>{t.register}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: 16 * settings.textScale }]}>{t.general}</Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.language}</Text>
            <Switch
              value={isEn}
              onValueChange={toggleLanguage}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={isEn ? '#E53935' : '#FFF'}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.haptic}</Text>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={toggleHaptic}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={settings.hapticEnabled ? '#E53935' : '#FFF'}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.sound}</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={settings.soundEnabled ? '#E53935' : '#FFF'}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.swipeMode}</Text>
            <Switch
              value={settings.swipeModeEnabled}
              onValueChange={toggleSwipeMode}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={settings.swipeModeEnabled ? '#E53935' : '#FFF'}
            />
          </View>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                if (settings.hapticEnabled) Vibration.vibrate(200);
                else Alert.alert(isEn ? 'Vibration is off' : 'Rung đang tắt');
              }}
            >
              <Text style={[styles.secondaryBtnText, { fontSize: baseFontSize - 1 }]}>{t.testHaptic}</Text>
            </Pressable>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                settings.soundEnabled && playSoundEffect(require('../assets/sounds/ting.mp3'))
              }
            >
              <Text style={[styles.primaryBtnText, { fontSize: baseFontSize - 1 }]}>{t.testSound}</Text>
            </Pressable>
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: 16 * settings.textScale }]}>{t.accessibility}</Text>

          {/* Text Scale */}
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.largeText}</Text>
            <View style={styles.scalerRow}>
              <Pressable style={styles.scalerBtn} onPress={decreaseTextScale}>
                <Text style={styles.scalerBtnText}>−</Text>
              </Pressable>
              <Text style={styles.scalerVal}>{settings.textScale.toFixed(1)}×</Text>
              <Pressable style={styles.scalerBtn} onPress={increaseTextScale}>
                <Text style={styles.scalerBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.reduceMotion}</Text>
            <Switch
              value={settings.reduceMotion}
              onValueChange={toggleReduceMotion}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={settings.reduceMotion ? '#E53935' : '#FFF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { fontSize: baseFontSize }]}>{t.disableConfetti}</Text>
            <Switch
              value={settings.disableConfetti}
              onValueChange={toggleConfetti}
              trackColor={{ true: '#F8D7DA', false: '#F0F0F0' }}
              thumbColor={settings.disableConfetti ? '#E53935' : '#FFF'}
            />
          </View>
        </View>

        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { fontSize: baseFontSize - 2 }]}>{t.version}</Text>
          <Text style={[styles.companyText, { fontSize: baseFontSize - 3 }]}>© 2024 Lắc Lắc Team</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFCDD2',
    position: 'relative',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E53935',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfoCol: { flex: 1 },
  userName: { fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  userEmail: { color: '#888', marginBottom: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoutText: { color: '#E53935', fontWeight: '600' },
  authBtns: { flexDirection: 'row', gap: 10 },
  loginBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loginBtnText: { color: '#FFF', fontWeight: '700' },
  registerBtn: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  registerBtnText: { color: '#333', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  toggleLabel: { color: '#333', fontWeight: '500', flex: 1 },
  scalerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scalerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scalerBtnText: { fontSize: 18, fontWeight: '700', color: '#E53935' },
  scalerVal: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 36, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#666', fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#FFF0F1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#E53935', fontWeight: '600' },
  versionFooter: { alignItems: 'center', marginTop: 20, opacity: 0.5 },
  versionText: { color: '#666', fontWeight: '500', marginBottom: 4 },
  companyText: { color: '#999' },
});
