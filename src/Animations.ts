import * as React from "react";
import Animated, { Easing } from "react-native-reanimated";
import { useMemoOne } from "use-memo-one";

import { TransformsStyle } from "react-native";
import { min } from "./Math";
import { timing, spring, SpringConfig } from "./AnimationRunners";

const {
  Value,
  set,
  add,
  multiply,
  cond,
  eq,
  abs,
  sub,
  interpolate,
  divide,
  useCode,
  not,
  defined,
  neq
} = Animated;

type AnimatedTransform = {
  [P in keyof TransformsStyle["transform"]]: Animated.Adaptable<
    TransformsStyle["transform"][P]
  >
};

export const snapPoint = (
  value: Animated.Adaptable<number>,
  velocity: Animated.Adaptable<number>,
  points: Animated.Adaptable<number>[]
) => {
  const point = add(value, multiply(0.2, velocity));
  const diffPoint = (p: Animated.Adaptable<number>) => abs(sub(point, p));
  const deltas = points.map(p => diffPoint(p));
  const minDelta = min(...deltas);
  return points.reduce(
    (acc, p) => cond(eq(diffPoint(p), minDelta), p, acc),
    new Value()
  );
};

export const bInterpolate = (
  value: Animated.Adaptable<number>,
  origin: Animated.Adaptable<number>,
  destination: Animated.Adaptable<number>
) =>
  interpolate(value, {
    inputRange: [0, 1],
    outputRange: [origin, destination]
  });

export const translateZ = (
  perspective: Animated.Adaptable<number>,
  z: Animated.Adaptable<number>
) => ({ scale: divide(perspective, sub(perspective, z)) });

export const transformOrigin = (
  x: Animated.Adaptable<number> = 0,
  y: Animated.Adaptable<number> = 0,
  ...transformations: AnimatedTransform[]
): AnimatedTransform[] => [
  { translateX: x },
  { translateY: y },
  ...transformations,
  { translateX: multiply(x, -1) },
  { translateY: multiply(y, -1) }
];

export const useTransition = <T extends unknown>(
  state: T,
  src: Animated.Adaptable<number>,
  dest: Animated.Adaptable<number>,
  duration: number = 400,
  easing: Animated.EasingFunction = Easing.linear
) => {
  if (!React.useMemo) {
    throw new Error(
      "useTransition() is only available in React Native 0.59 or higher."
    );
  }
  const { transitionVal } = useMemoOne(
    () => ({
      transitionVal: new Value() as Animated.Value<number>
    }),
    []
  );
  useCode(
    cond(
      not(defined(transitionVal)),
      set(transitionVal, src),
      cond(
        neq(transitionVal, src),
        set(
          transitionVal,
          timing({
            from: dest,
            to: src,
            duration,
            easing
          })
        )
      )
    ),
    [state]
  );
  return transitionVal;
};

export const useToggle = (
  toggle: boolean,
  duration: number = 400,
  easing: Animated.EasingFunction = Easing.linear
) =>
  useTransition(toggle, toggle ? 1 : 0, not(toggle ? 1 : 0), duration, easing);

export const useSpringTransition = <T extends unknown>(
  state: T,
  src: Animated.Adaptable<number>,
  dest: Animated.Adaptable<number>,
  velocity: Animated.Value<number> | undefined = undefined,
  config: SpringConfig | undefined = undefined
) => {
  const { transitionVal } = useMemoOne(
    () => ({
      transitionVal: new Value() as Animated.Value<number>
    }),
    []
  );
  useCode(
    cond(
      not(defined(transitionVal)),
      set(transitionVal, src),
      cond(
        neq(transitionVal, src),
        set(
          transitionVal,
          spring({
            from: dest,
            to: src,
            velocity,
            config
          })
        )
      )
    ),
    [state]
  );
  return transitionVal;
};

export const useSpringToggle = (
  toggle: boolean,
  velocity: Animated.Value<number> | undefined = undefined,
  config: SpringConfig | undefined = undefined
) =>
  useSpringTransition(
    toggle,
    toggle ? 1 : 0,
    not(toggle ? 1 : 0),
    velocity,
    config
  );
