import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { fetchFoodDetail, FoodItem, logAction } from '../../src/lib/api';
import { getOrCreateSessionId } from '../../src/store/session';

export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    const run = async () => {
      setLoading(true);
      try {
        const detail = await fetchFoodDetail(params.id);
        setFood(detail);

        const sessionId = await getOrCreateSessionId();
        await logAction({
          sessionId,
          foodId: params.id,
          actionType: 'view_detail',
          context: 'none',
        });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.id]);

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
        <Text>Khong tim thay mon an.</Text>
      </View>
    );
  }

  const image = food.images?.[0] || food.thumbnailImage;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <Text style={styles.name}>{food.name}</Text>
      <Text style={styles.desc}>{food.description || 'Mon ngon phu hop voi khau vi Viet.'}</Text>

      <View style={styles.badges}>
        <Text style={styles.badge}>Gia: {food.priceRange || 'medium'}</Text>
        <Text style={styles.badge}>Calo: {food.calories || 0}</Text>
        <Text style={styles.badge}>Nau: {food.cookingStyle || 'dry'}</Text>
      </View>
    </ScrollView>
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
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 16,
  },
  name: {
    fontSize: 26,
    color: '#2D3561',
    fontWeight: '900',
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
});
