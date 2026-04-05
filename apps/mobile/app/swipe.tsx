import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Link } from 'expo-router';

import { FoodCard } from '../src/components/food-card';
import { fetchSwipeQueue, FoodItem, logAction } from '../src/lib/api';
import { useFilterStore } from '../src/store/filter-store';
import { getOrCreateSessionId } from '../src/store/session';

export default function SwipeScreen() {
  const { filters } = useFilterStore();
  const [sessionId, setSessionId] = useState<string>('');
  const [cards, setCards] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const queue = await fetchSwipeQueue(filters);
      setCards(queue);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void getOrCreateSessionId().then(setSessionId);
    void loadQueue();
  }, [loadQueue]);

  const submitSwipe = useCallback(
    async (foodId: string | undefined, actionType: 'swipe_left' | 'swipe_right') => {
      if (!foodId || !sessionId) return;

      await logAction({
        sessionId,
        foodId,
        actionType,
        context: filters.context ?? 'none',
        filterSnapshot: {
          priceRange: filters.priceRange,
          mealType: filters.mealType,
          dietTag: filters.dietTag,
        },
      });
    },
    [filters, sessionId],
  );

  if (loading && cards.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swipe mon an</Text>
      <Text style={styles.sub}>Vuot phai de thich, vuot trai de bo qua.</Text>

      <View style={styles.swiperWrap}>
        {cards.length > 0 ? (
          <Swiper
            cards={cards}
            renderCard={(card) => <FoodCard food={card} />}
            onSwipedLeft={(index) => void submitSwipe(cards[index]?._id, 'swipe_left')}
            onSwipedRight={(index) => void submitSwipe(cards[index]?._id, 'swipe_right')}
            onSwipedAll={() => void loadQueue()}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={3}
            horizontalThreshold={100}
          />
        ) : (
          <Text style={styles.empty}>Da het card, dang tai them...</Text>
        )}
      </View>

      <Link href="/" style={styles.backLink}>
        Quay lai trang chinh
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3561',
  },
  sub: {
    marginTop: 4,
    color: '#6E6A65',
  },
  swiperWrap: {
    flex: 1,
    marginTop: 18,
  },
  empty: {
    color: '#6E6A65',
    textAlign: 'center',
    marginTop: 50,
  },
  backLink: {
    backgroundColor: '#FFC914',
    color: '#2D3561',
    borderRadius: 12,
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '700',
  },
});
