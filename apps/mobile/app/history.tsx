import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistoryStore } from '../src/store/history-store';
import { useSettingsStore } from '../src/store/settings-store';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, clearHistory } = useHistoryStore();
  const settings = useSettingsStore();
  const isEn = settings.language === 'en';

  const t = {
    title: isEn ? 'Recent Foods' : 'Món ăn gần đây',
    clear: isEn ? 'Clear' : 'Xóa',
    empty: isEn ? 'No recent foods yet =(' : 'Chưa có món ăn nào gần đây =(',
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.foodCard} onPress={() => router.push(`/food/${item._id}`)}>
      <Image
        source={{
          uri: item.thumbnailImage || item.images?.[0] || 'https://placehold.co/120x120/png',
        }}
        style={styles.foodImage}
      />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>
          {typeof item.name === 'string' ? item.name : item.name?.vi}
        </Text>
        <Text style={styles.foodDesc} numberOfLines={2}>
          {typeof item.description === 'string' ? item.description : item.description?.vi || 'Không có mô tả'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t.title,
          headerRight: () => (
            <Pressable onPress={clearHistory} hitSlop={15}>
              <Ionicons name="trash-outline" size={24} color="#E53935" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fast-food-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>{t.empty}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { padding: 20, paddingBottom: 40 },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F0F0F0' },
  foodInfo: { flex: 1, marginLeft: 15 },
  foodName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  foodDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
});
