import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'laclac_session_id';

const randomHex = () =>
  Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .slice(1);

const generateUuidV4 = (): string => {
  return `${randomHex()}${randomHex()}-${randomHex()}-4${randomHex().slice(1)}-${(
    (8 + Math.floor(Math.random() * 4)).toString(16) + randomHex().slice(1)
  ).slice(0, 4)}-${randomHex()}${randomHex()}${randomHex()}`;
};

export const getOrCreateSessionId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = generateUuidV4();
  await AsyncStorage.setItem(SESSION_KEY, created);
  return created;
};
