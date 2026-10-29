import { PropsWithChildren, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform } from 'react-native';

export default function RaisedTab({ active, children }: PropsWithChildren<{ active: boolean }>) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let disposed = false;
    const move = (reduce: boolean) => {
      if (disposed) return;
      progress.stopAnimation();
      if (reduce) progress.setValue(active ? 1 : 0);
      else Animated.spring(progress, { toValue: active ? 1 : 0, stiffness: 190, damping: 19, mass: .8, useNativeDriver: Platform.OS !== 'web' }).start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(move).catch(() => move(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', move);
    return () => { disposed = true; subscription.remove(); progress.stopAnimation(); };
  }, [active, progress]);
  return <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.13] }) }] }}>{children}</Animated.View>;
}
