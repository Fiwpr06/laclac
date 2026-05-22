import { memo } from 'react';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FoodItem } from '../lib/api';
import { tPriceRange, tCookingStyle } from '../lib/i18n';
import { useSettingsStore } from '../store/settings-store';

type Props = {
  food: FoodItem;
};


const FoodCardComponent = ({ food }: Props) => {
  const { language } = useSettingsStore();
  const isEn = language === 'en';
  const image = food.thumbnailImage || food.images?.[0];
  const priceLabel = food.priceRange ? tPriceRange(food.priceRange, isEn) : undefined;

  return (
    <View style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>Chưa có ảnh món ăn</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.infoOverlays}>
          {priceLabel ? (
            <View style={styles.priceBubble}>
              <Text style={styles.priceBubbleText}>{priceLabel}</Text>
            </View>
          ) : null}
          <View style={styles.tagsContainer}>
            {food.cookingStyle ? <Text style={styles.tagChip}>{tCookingStyle(food.cookingStyle, isEn)}</Text> : null}
          </View>
        </View>

        <Text style={styles.name}>{food.name?.vi}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {food.description?.vi || 'Món ngon cân bằng và hấp dẫn, phù hợp cho bữa ăn của bạn.'}
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="bookmark-outline" size={20} color="#333" />
            <Text style={styles.iconButtonText}>Lưu</Text>
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="information-circle-outline" size={20} color="#333" />
            <Text style={styles.iconButtonText}>Chi tiết</Text>
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={20} color="#333" />
            <Text style={styles.iconButtonText}>Chia sẻ</Text>
          </Pressable>
          <Pressable style={styles.primaryButton}>
            <Ionicons name="bag-handle" size={18} color="#FFF" />
            <Text style={styles.primaryButtonText}>Đặt ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const FoodCard = memo(FoodCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  imageFallback: {
    width: '100%',
    height: 240,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  imageFallbackText: {
    color: '#888',
    fontWeight: '500',
  },
  body: {
    padding: 20,
    paddingTop: 8,
  },
  infoOverlays: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 12,
    zIndex: 10,
  },
  priceBubble: {
    backgroundColor: '#F8D7DA',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    padding: 4,
  },
  priceBubbleText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginTop: 20,
  },
  tagChip: {
    backgroundColor: '#FFFFFF',
    color: '#555',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  name: {
    fontSize: 26,
    color: '#1A1A1A',
    fontWeight: '400',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  description: {
    color: '#555',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#FFF',
  },
  iconButtonText: {
    fontSize: 10,
    color: '#333',
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    gap: 6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
