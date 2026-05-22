import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { useFilterStore } from '../src/store/filter-store';
import { useSettingsStore } from '../src/store/settings-store';
import {
  tPriceRange,
  tBudgetBucket,
  tDishType,
  tCuisineType,
  tMealType,
  tCookingStyle,
  tDietTag,
} from '../src/lib/i18n';

type Option<T extends string> = {
  label: string;
  value: T;
};

const getPriceOptions = (isEn: boolean): Array<Option<'cheap' | 'medium' | 'expensive'>> => [
  { label: tPriceRange('cheap', isEn)!, value: 'cheap' },
  { label: tPriceRange('medium', isEn)!, value: 'medium' },
  { label: tPriceRange('expensive', isEn)!, value: 'expensive' },
];

const getBudgetOptions = (
  isEn: boolean,
): Array<Option<'under_30k' | 'from_30k_to_50k' | 'from_50k_to_100k' | 'over_100k'>> => [
  { label: tBudgetBucket('under_30k', isEn)!, value: 'under_30k' },
  { label: tBudgetBucket('from_30k_to_50k', isEn)!, value: 'from_30k_to_50k' },
  { label: tBudgetBucket('from_50k_to_100k', isEn)!, value: 'from_50k_to_100k' },
  { label: tBudgetBucket('over_100k', isEn)!, value: 'over_100k' },
];

const getDishTypeOptions = (isEn: boolean): Array<Option<'liquid' | 'dry' | 'fried_grilled'>> => [
  { label: tDishType('liquid', isEn)!, value: 'liquid' },
  { label: tDishType('dry', isEn)!, value: 'dry' },
  { label: tDishType('fried_grilled', isEn)!, value: 'fried_grilled' },
];

const getCuisineOptions = (isEn: boolean): Array<Option<'vietnamese' | 'asian' | 'european'>> => [
  { label: tCuisineType('vietnamese', isEn)!, value: 'vietnamese' },
  { label: tCuisineType('asian', isEn)!, value: 'asian' },
  { label: tCuisineType('european', isEn)!, value: 'european' },
];

const getMealOptions = (isEn: boolean): Array<Option<'breakfast' | 'lunch' | 'dinner' | 'snack'>> => [
  { label: tMealType('breakfast', isEn)!, value: 'breakfast' },
  { label: tMealType('lunch', isEn)!, value: 'lunch' },
  { label: tMealType('dinner', isEn)!, value: 'dinner' },
  { label: tMealType('snack', isEn)!, value: 'snack' },
];

const getCookingStyleOptions = (
  isEn: boolean,
): Array<Option<'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed'>> => [
  { label: tCookingStyle('soup', isEn)!, value: 'soup' },
  { label: tCookingStyle('dry', isEn)!, value: 'dry' },
  { label: tCookingStyle('fried', isEn)!, value: 'fried' },
  { label: tCookingStyle('grilled', isEn)!, value: 'grilled' },
  { label: tCookingStyle('raw', isEn)!, value: 'raw' },
  { label: tCookingStyle('steamed', isEn)!, value: 'steamed' },
];

const getDietOptions = (isEn: boolean): Array<Option<'vegetarian' | 'vegan' | 'keto' | 'clean'>> => [
  { label: tDietTag('vegetarian', isEn)!, value: 'vegetarian' },
  { label: tDietTag('vegan', isEn)!, value: 'vegan' },
  { label: tDietTag('keto', isEn)!, value: 'keto' },
  { label: tDietTag('clean', isEn)!, value: 'clean' },
];

const getContextOptions = (
  isEn: boolean,
): Array<Option<'solo' | 'date' | 'group' | 'travel' | 'office'>> => [
  { label: isEn ? 'Solo' : 'Một mình', value: 'solo' },
  { label: isEn ? 'Date' : 'Hẹn hò', value: 'date' },
  { label: isEn ? 'Group' : 'Nhóm bạn', value: 'group' },
  { label: isEn ? 'Travel' : 'Du lịch', value: 'travel' },
  { label: isEn ? 'Office' : 'Văn phòng', value: 'office' },
];

const getAllergens = (isEn: boolean): Array<Option<string>> => [
  { label: isEn ? 'Peanuts' : 'Đậu phộng', value: 'peanuts' },
  { label: isEn ? 'Shellfish' : 'Hải sản có vỏ', value: 'shellfish' },
  { label: isEn ? 'Dairy' : 'Sữa', value: 'dairy' },
  { label: isEn ? 'Gluten' : 'Gluten', value: 'gluten' },
];

const playSoundEffect = async (resource: any) => {
  try {
    const { sound } = await Audio.Sound.createAsync(resource);
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
    await sound.playAsync();
  } catch (err) {}
};

const Choice = <T extends string>({
  title,
  options,
  current,
  onSelect,
}: {
  title: string;
  options: Array<Option<T>>;
  current?: T;
  onSelect: (value?: T) => void;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.row}>
      {options.map((item) => (
        <Pressable
          key={item.value}
          style={[styles.pill, current === item.value && styles.pillActive]}
          onPress={async () => {
            await playSoundEffect(require('../assets/sounds/tick-filter.mp3'));
            onSelect(current === item.value ? undefined : item.value);
          }}
        >
          <Text style={[styles.pillText, current === item.value && styles.pillTextActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export default function FilterScreen() {
  const router = useRouter();
  const { filters, setFilter, reset } = useFilterStore();
  const { language } = useSettingsStore();
  const isEn = language === 'en';

  const handleReset = () => {
    if (reset) reset();
  };

  const toggleAllergen = (val: string) => {
    const arr = filters.allergenExclude || [];
    if (arr.includes(val)) {
      setFilter(
        'allergenExclude',
        arr.filter((t) => t !== val),
      );
    } else {
      setFilter('allergenExclude', [...arr, val]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEn ? 'Filter Preferences' : 'Bộ Lọc Sở Thích'}</Text>
        <Pressable onPress={handleReset}>
          <Text style={styles.clearText}>{isEn ? 'Clear All' : 'Xóa Hết'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Choice
          title={isEn ? 'Price Range' : 'Mức giá (Phân loại)'}
          options={getPriceOptions(isEn)}
          current={filters.priceRange as any}
          onSelect={(value) => setFilter('priceRange' as any, value)}
        />

        <Choice
          title={isEn ? 'Budget' : 'Khoảng giá (Chi tiết)'}
          options={getBudgetOptions(isEn)}
          current={filters.budgetBucket as any}
          onSelect={(value) => setFilter('budgetBucket' as any, value)}
        />

        <Choice
          title={isEn ? 'Dish Type' : 'Thể loại món'}
          options={getDishTypeOptions(isEn)}
          current={filters.dishType as any}
          onSelect={(value) => setFilter('dishType' as any, value)}
        />

        <Choice
          title={isEn ? 'Cuisine' : 'Ẩm thực'}
          options={getCuisineOptions(isEn)}
          current={filters.cuisineType as any}
          onSelect={(value) => setFilter('cuisineType' as any, value)}
        />

        <Choice
          title={isEn ? 'Cooking Style' : 'Cách chế biến'}
          options={getCookingStyleOptions(isEn)}
          current={filters.cookingStyle as any}
          onSelect={(value) => setFilter('cookingStyle' as any, value)}
        />

        <Choice
          title={isEn ? 'Meal' : 'Bữa ăn'}
          options={getMealOptions(isEn)}
          current={filters.mealType as any}
          onSelect={(value) => setFilter('mealType' as any, value)}
        />

        <Choice
          title={isEn ? 'Diet' : 'Chế độ ăn kiêng'}
          options={getDietOptions(isEn)}
          current={filters.dietTag as any}
          onSelect={(value) => setFilter('dietTag' as any, value)}
        />

        <Choice
          title={isEn ? 'Context' : 'Ngữ cảnh'}
          options={getContextOptions(isEn)}
          current={filters.context as any}
          onSelect={(value) => setFilter('context' as any, value)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isEn ? 'Allergies / Exclusions' : 'Dị Ứng / Cấm Kỵ'}</Text>
          <View style={styles.optionsWrap}>
            {getAllergens(isEn).map((allergen, index) => {
              const isActive = (filters.allergenExclude || []).includes(allergen.value);
              const isLast = index === getAllergens(isEn).length - 1;
              return (
                <View
                  key={allergen.value}
                  style={[styles.toggleRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.rowLabel}>{allergen.label}</Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleAllergen(allergen.value)}
                    trackColor={{ false: '#EAEAEA', true: '#FFCDD2' }}
                    thumbColor={isActive ? '#E53935' : '#FFF'}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.applyBtn} onPress={() => router.back()}>
          <Text style={styles.applyBtnText}>{isEn ? 'Shake with Filter' : 'Lắc Với Bộ Lọc'}</Text>
          <Ionicons name="restaurant" size={18} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', fontFamily: 'serif' },
  clearText: { color: '#666', fontSize: 14, fontWeight: '500' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  pillActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
  pillText: { color: '#333', fontSize: 14, fontWeight: '500' },
  pillTextActive: { color: '#FFF', fontWeight: '700' },
  optionsWrap: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowLabel: { fontSize: 16, color: '#333' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  applyBtn: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
