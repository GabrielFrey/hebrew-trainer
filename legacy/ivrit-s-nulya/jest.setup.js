jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

require('./lib/lexicon').loadLexiconForTests();

// Нативный аудиомодуль в тестах не поднимается, поэтому фиксируем вызовы:
// так проверяется, что для слова без записи плеер вообще не создаётся.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ play: jest.fn(), remove: jest.fn(), playbackRate: 1 })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GlassView: ({ children, ...props }) => React.createElement(View, props, children),
    GlassContainer: ({ children, ...props }) => React.createElement(View, props, children),
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...props }) => React.createElement(View, props, children),
  };
});

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: ({ fallback, ...props }) => React.createElement(View, props, fallback ?? null),
  };
});
