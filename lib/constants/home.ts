export const HOME_SCENE_CONFIG = {
  camera: {
    radius: 32,
    azimuth: -40.98998257391969,
    elevation: 2.352707946255949,
    verticalFov: 50,
  },
  disk: { opacity: 1, accretion: 1, temperature: 5600, flare: [0, 0, 0, 0] },
  source: { z: -24, halfSize: [16, 9], dim: 1 },
  rendering: {
    pixelRatio: 1.5,
    maxSteps: 330,
    exposure: 0.9,
    bloom: { strength: 0.6, threshold: 1, factors: [1, 0.6, 0.28, 0.08] },
  },
  presentation: {
    rotation: -50,
    cardAngle: 24,
    autoplayInterval: 3600,
    wheelSettleDelay: 60,
    swipeDistance: 240,
    labelExitDuration: 100,
    labelEnterDuration: 220,
    starfieldSpeed: 0.5,
  },
  animation: { time: 30.134399999977063 },
} as const;
