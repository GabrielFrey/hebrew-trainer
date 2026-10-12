jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

require('./lib/lexicon').loadLexiconForTests();

// Нативный аудиомодуль в тестах не поднимается, поэтому фиксируем вызовы:
// так проверяется, что для слова без записи плеер вообще не создаётся.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ play: jest.fn(), remove: jest.fn() })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
