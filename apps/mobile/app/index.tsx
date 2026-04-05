import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Link } from 'expo-router';

import { FoodCard } from '../src/components/food-card';
import { fetchRandomFood, FoodItem, logAction } from '../src/lib/api';
import { useShakeDetector } from '../src/hooks/use-shake-detector';
import { useFilterStore } from '../src/store/filter-store';
import { getOrCreateSessionId } from '../src/store/session';

export default function HomeScreen() {
  const { filters } = useFilterStore();
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [food, setFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    void getOrCreateSessionId().then(setSessionId);
  }, []);

  const filterSnapshot = useMemo(
    () => ({
      priceRange: filters.priceRange,
      mealType: filters.mealType,
      dietTag: filters.dietTag,
      category: undefined,
    }),
    [filters],
  );

  const loadRandom = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const randomFood = await fetchRandomFood(filters);
      setFood(randomFood);

      if (sessionId && randomFood?._id) {
        await logAction({
          sessionId,
          foodId: randomFood._id,
          actionType: 'shake_result',
          context: filters.context ?? 'none',
          filterSnapshot,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters, filterSnapshot, loading, sessionId]);

  useShakeDetector(loadRandom, { thresholdG: 2.5, debounceMs: 1000 });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>Lắc Lắc</Text>
      <Text style={styles.title}>Lắc một cái - biết ngay ăn gì!</Text>

      <View style={styles.animationBox}>
        <LottieView
          source={require('../assets/shake.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>

      <Pressable style={styles.shakeButton} onPress={() => void loadRandom()}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.shakeText}>Lắc ngay</Text>
        )}
      </Pressable>

      {food ? (
        <FoodCard food={food} />
      ) : (
        <Text style={styles.placeholder}>Chua co mon nao duoc goi y.</Text>
      )}

      <View style={styles.links}>
        <Link href="/swipe" style={styles.linkButton}>
          Swipe mon
        </Link>
        <Link href="/filter" style={styles.linkButton}>
          Bo loc
        </Link>
        <Link href="/profile" style={styles.linkButton}>
          Ho so
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  brand: {
    color: '#FF6B35',
    fontWeight: '900',
    fontSize: 28,
  },
  title: {
    color: '#2D3561',
    fontSize: 20,
    fontWeight: '700',
  },
  animationBox: {
    height: 180,
    backgroundColor: '#FFF4EE',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 160,
    height: 160,
  },
  shakeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shakeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  placeholder: {
    color: '#7E7A76',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  linkButton: {
    flex: 1,
    backgroundColor: '#FFC914',
    paddingVertical: 10,
    textAlign: 'center',
    borderRadius: 12,
    color: '#2D3561',
    fontWeight: '700',
  },
});
