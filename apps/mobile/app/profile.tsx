import { StyleSheet, Text, View } from 'react-native';

import { useFilterStore } from '../src/store/filter-store';

export default function ProfileScreen() {
  const { filters } = useFilterStore();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Lắc Lắc</Text>
      <Text style={styles.title}>Ho so dinh duong</Text>
      <Text style={styles.description}>
        V1 uu tien thu thap hanh vi swipe/lac de chuan bi recommendation thong minh o v3.
      </Text>

      <View style={styles.card}>
        <Text style={styles.item}>Gia uu tien: {filters.priceRange || 'chua chon'}</Text>
        <Text style={styles.item}>Bua an: {filters.mealType || 'chua chon'}</Text>
        <Text style={styles.item}>Che do an: {filters.dietTag || 'chua chon'}</Text>
        <Text style={styles.item}>Ngu canh: {filters.context || 'chua chon'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    padding: 18,
    gap: 12,
  },
  brand: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: '900',
  },
  title: {
    color: '#2D3561',
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    color: '#67625E',
    lineHeight: 22,
  },
  card: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFE8DF',
  },
  item: {
    color: '#2D3561',
    fontWeight: '600',
  },
});
