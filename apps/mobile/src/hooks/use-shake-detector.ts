import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export const useShakeDetector = (
  onShake: () => void,
  config?: {
    thresholdG?: number;
    debounceMs?: number;
  },
) => {
  const threshold = config?.thresholdG ?? 2.5;
  const debounceMs = config?.debounceMs ?? 1000;
  const lastTriggered = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(200);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > threshold && now - lastTriggered.current > debounceMs) {
        lastTriggered.current = now;
        onShake();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onShake, threshold, debounceMs]);
};
