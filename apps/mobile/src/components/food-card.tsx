import { Image, StyleSheet, Text, View } from 'react-native';

import { FoodItem } from '../lib/api';

type Props = {
  food: FoodItem;
};

export const FoodCard = ({ food }: Props) => {
  const image = food.thumbnailImage || food.images?.[0];

  return (
    <View style={styles.card}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <View style={styles.body}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {food.description || 'Mon ngon hop voi ban.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1EDE7',
    shadowColor: '#2D3561',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 230,
  },
  body: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    color: '#2D3561',
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    color: '#6E6A65',
    fontSize: 14,
    lineHeight: 20,
  },
});
