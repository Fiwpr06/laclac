import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../src/lib/auth-api';
import { useAuthStore } from '../src/store/auth-store';
import { useSettingsStore } from '../src/store/settings-store';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const settings = useSettingsStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEn = settings.language === 'en';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(isEn ? 'Error' : 'Lỗi', isEn ? 'Please fill all fields' : 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      setAuth(res.user, res.accessToken, res.refreshToken);
      // Sync settings from server
      if (res.user.settings) {
        const s = res.user.settings;
        if (s.language) settings.setLanguage(s.language);
        if (s.soundEnabled !== undefined) settings.setSound(s.soundEnabled);
        if (s.hapticEnabled !== undefined) settings.setHaptic(s.hapticEnabled);
        if (s.reduceMotion !== undefined) settings.setReduceMotion(s.reduceMotion);
        if (s.disableConfetti !== undefined) settings.setDisableConfetti(s.disableConfetti);
        if (s.textScale !== undefined) settings.setTextScale(s.textScale);
      }
      router.replace('/');
    } catch (err: any) {
      Alert.alert(isEn ? 'Login failed' : 'Đăng nhập thất bại', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoText}>🍜</Text>
          <Text style={styles.brand}>Lắc Lắc</Text>
          <Text style={styles.tagline}>{isEn ? 'Discover your next meal' : 'Khám phá món ăn tiếp theo'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>{isEn ? 'Sign In' : 'Đăng nhập'}</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={isEn ? 'Password' : 'Mật khẩu'}
              placeholderTextColor="#999"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
            </Pressable>
          </View>

          <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>{isEn ? 'Sign In' : 'Đăng nhập'}</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>
              {isEn ? "Don't have an account? " : 'Chưa có tài khoản? '}
              <Text style={styles.linkBold}>{isEn ? 'Sign Up' : 'Đăng ký'}</Text>
            </Text>
          </Pressable>

          <Pressable style={styles.skipBtn} onPress={() => router.replace('/')}>
            <Text style={styles.skipText}>{isEn ? 'Continue as Guest' : 'Tiếp tục không đăng nhập'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 60 },
  logo: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 56 },
  brand: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', marginTop: 8 },
  tagline: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heading: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    backgroundColor: '#E53935',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginBottom: 12 },
  linkText: { fontSize: 14, color: '#666' },
  linkBold: { color: '#E53935', fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: 4 },
  skipText: { fontSize: 13, color: '#AAA' },
});
