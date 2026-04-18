import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchFoodDetail, FoodItem, logAction, postShake } from '../../src/lib/api';
import { getOrCreateSessionId } from '../../src/store/session';
import { useFilterStore } from '../../src/store/filter-store';
import { useHistoryStore } from '../../src/store/history-store';
import { useShakeDetector } from '../../src/hooks/use-shake-detector';
import { useSettingsStore } from '../../src/store/settings-store';
import { useAuthStore } from '../../src/store/auth-store';
import { favoritesApi, historyApi } from '../../src/lib/user-api';

const playSoundEffect = async (resource: any) => {
  try {
    const { sound } = await Audio.Sound.createAsync(resource);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (err) {
    console.warn('Error playing sound:', err);
  }
};

export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const { filters } = useFilterStore();
  const { addHistory } = useHistoryStore();
  const { soundEnabled, hapticEnabled } = useSettingsStore();
  const { user, accessToken } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [isShaking, setIsShaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [togglingFav, setTogglingFav] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const handleDirectShake = async (isManual = true) => {
    if (isShaking) return;
    try {
      setIsShaking(true);
      if (soundEnabled) {
        await playSoundEffect(require('../../assets/sounds/shake.mp3'));
      }

      const res = await postShake({
        sessionId: Date.now().toString(),
        triggerType: isManual ? 'button' : 'shake',
        filters,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      if (res && res.food) {
        if (hapticEnabled) Vibration.vibrate();
        if (soundEnabled) {
          await playSoundEffect(require('../../assets/sounds/ting.mp3'));
        }
        addHistory(res.food);
        router.replace(`/food/${res.food._id}?from=shake`);
      } else {
        if (hapticEnabled) Vibration.vibrate();
        if (soundEnabled) {
          await playSoundEffect(require('../../assets/sounds/false.mp3'));
        }
        Alert.alert('Không thể tải món', 'Không lấy được món ăn nào khác.');
      }
    } catch (err) {
      if (hapticEnabled) Vibration.vibrate();
      if (soundEnabled) {
        await playSoundEffect(require('../../assets/sounds/false.mp3'));
      }
      Alert.alert('Lỗi', 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setTimeout(() => setIsShaking(false), 1000);
    }
  };

  useShakeDetector(
    () => {
      handleDirectShake(false);
    },
    { enabled: isFocused && !loading && !isShaking },
  );

  // Log view action
  useEffect(() => {
    if (!params.id) return;

    const run = async () => {
      setLoading(true);
      setErrorText(undefined);
      try {
        const detail = await fetchFoodDetail(params.id);
        setFood(detail);

        void getOrCreateSessionId()
          .then((sessionId) =>
            logAction({
              sessionId,
              foodId: params.id,
              actionType: 'view_detail',
              context: 'none',
            }),
          )
          .catch(() => {});

        // Check if favorited
        if (accessToken) {
          const fid = await favoritesApi.isFavorited(params.id, accessToken);
          setFavoriteId(fid);
        }
      } catch {
        setErrorText('Không tải được dữ liệu món ăn. Vui lòng thử lại.');
        setFood(null);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.id, accessToken]);

  const handleToggleFavorite = async () => {
    if (!user || !accessToken) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để lưu trữ món ăn yêu thích.', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!food) return;
    setTogglingFav(true);
    try {
      if (favoriteId) {
        await favoritesApi.remove(favoriteId, accessToken);
        setFavoriteId(null);
      } else {
        const created = await favoritesApi.add(food._id, accessToken);
        setFavoriteId(created._id);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không thể thực hiện');
    } finally {
      setTogglingFav(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{errorText ?? 'Không tìm thấy món ăn.'}</Text>
      </View>
    );
  }

  const image = food.images?.[0] || food.thumbnailImage;

  const handleFavoritePress = () => handleToggleFavorite();

  const isFromShake = params.from === 'shake';

  const cleanString = (str?: string | null) => {
    if (!str) return '';
    return str.trim();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : null}

        <View style={styles.headerRow}>
          <Text style={styles.name}>{food.name}</Text>
          <Pressable onPress={handleFavoritePress} style={styles.heartBtn} disabled={togglingFav}>
            {togglingFav ? (
              <ActivityIndicator color="#FF6B35" size="small" />
            ) : (
              <Ionicons
                name={favoriteId ? 'heart' : 'heart-outline'}
                size={28}
                color={favoriteId ? '#E53935' : '#FF6B35'}
              />
            )}
          </Pressable>
        </View>

        <Text style={styles.desc}>
          {cleanString(food.description) || 'Món ngon phù hợp với khẩu vị của bạn.'}
        </Text>

        <View style={styles.badges}>
          <Text style={styles.badge} numberOfLines={1}>
            Giá: {cleanString(food.priceRange) || 'medium'}
          </Text>
          <Text style={styles.badge} numberOfLines={1}>
            Calo: {food.calories || 0}
          </Text>
          <Text style={styles.badge} numberOfLines={1}>
            Nấu: {cleanString(food.cookingStyle) || 'dry'}
          </Text>
        </View>

        {food.allergens?.length ? (
          <Text style={styles.infoText}>Dị ứng cần lưu ý: {food.allergens.join(', ')}</Text>
        ) : null}
      </ScrollView>

      {isFromShake && (
        <View style={[styles.fixedBottom, { bottom: Math.max(insets.bottom, 24) + 16 }]}>
          <Pressable
            style={styles.shakeBtn}
            onPress={() => handleDirectShake(true)}
            disabled={isShaking}
          >
            {isShaking ? (
              <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons
                name="restaurant-outline"
                size={24}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.shakeBtnText}>Lắc Tiếp!</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heartBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF0E9',
  },
  name: {
    flex: 1,
    fontSize: 26,
    color: '#2D3561',
    fontWeight: '900',
    marginRight: 10,
  },
  desc: {
    color: '#5E5A56',
    lineHeight: 22,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF0E9',
    color: '#2D3561',
    fontWeight: '700',
  },
  infoText: {
    color: '#6E6A65',
    fontSize: 13,
  },
  emptyText: {
    color: '#2D3561',
    textAlign: 'center',
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  shakeBtn: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shakeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
