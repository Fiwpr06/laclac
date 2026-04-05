import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFilterStore } from '../src/store/filter-store';

type Option<T extends string> = {
  label: string;
  value: T;
};

const priceOptions: Array<Option<'cheap' | 'medium' | 'expensive'>> = [
  { label: 'Re', value: 'cheap' },
  { label: 'Vua', value: 'medium' },
  { label: 'Cao', value: 'expensive' },
];

const mealOptions: Array<Option<'breakfast' | 'lunch' | 'dinner' | 'snack'>> = [
  { label: 'Sang', value: 'breakfast' },
  { label: 'Trua', value: 'lunch' },
  { label: 'Toi', value: 'dinner' },
  { label: 'An vat', value: 'snack' },
];

const dietOptions: Array<Option<'vegetarian' | 'vegan' | 'keto' | 'clean'>> = [
  { label: 'Chay', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Keto', value: 'keto' },
  { label: 'Clean', value: 'clean' },
];

const contextOptions: Array<Option<'solo' | 'date' | 'group' | 'travel' | 'office'>> = [
  { label: 'Mot minh', value: 'solo' },
  { label: 'Hen ho', value: 'date' },
  { label: 'Nhom ban', value: 'group' },
  { label: 'Du lich', value: 'travel' },
  { label: 'Van phong', value: 'office' },
];

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
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.row}>
      {options.map((item) => (
        <Pressable
          key={item.value}
          style={[styles.option, current === item.value && styles.optionActive]}
          onPress={() => onSelect(current === item.value ? undefined : item.value)}
        >
          <Text style={[styles.optionText, current === item.value && styles.optionTextActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

export default function FilterScreen() {
  const { filters, setFilter, reset } = useFilterStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bo loc thong minh</Text>

      <Choice
        title="Khoang gia"
        options={priceOptions}
        current={filters.priceRange}
        onSelect={(value) => setFilter('priceRange', value)}
      />

      <Choice
        title="Bua an"
        options={mealOptions}
        current={filters.mealType}
        onSelect={(value) => setFilter('mealType', value)}
      />

      <Choice
        title="Che do an"
        options={dietOptions}
        current={filters.dietTag}
        onSelect={(value) => setFilter('dietTag', value)}
      />

      <Choice
        title="Ngu canh"
        options={contextOptions}
        current={filters.context}
        onSelect={(value) => setFilter('context', value)}
      />

      <Pressable style={styles.resetButton} onPress={reset}>
        <Text style={styles.resetText}>Dat lai bo loc</Text>
      </Pressable>
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
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D3561',
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    color: '#5F5A56',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  optionActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionText: {
    color: '#2D3561',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: '#2D3561',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
