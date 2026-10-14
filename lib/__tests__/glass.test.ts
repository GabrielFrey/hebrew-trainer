import { colorWithAlpha, resolveGlassMode } from '@/lib/glass';

describe('Liquid Glass mode', () => {
  it('uses native glass only on iOS when the API is compiled in', () => {
    expect(
      resolveGlassMode({
        platform: 'ios',
        liquidAvailable: true,
        apiAvailable: true,
        reduceTransparency: false,
        increaseContrast: false,
      })
    ).toBe('liquid');
  });

  it('falls back to blur on web, Android and older iOS', () => {
    expect(
      resolveGlassMode({
        platform: 'web',
        liquidAvailable: false,
        apiAvailable: false,
        reduceTransparency: false,
        increaseContrast: false,
      })
    ).toBe('blur');
    expect(
      resolveGlassMode({
        platform: 'android',
        liquidAvailable: false,
        apiAvailable: true,
        reduceTransparency: false,
        increaseContrast: false,
      })
    ).toBe('blur');
    expect(
      resolveGlassMode({
        platform: 'ios',
        liquidAvailable: false,
        apiAvailable: false,
        reduceTransparency: false,
        increaseContrast: false,
      })
    ).toBe('blur');
  });

  it('goes solid for Reduce Transparency and Increase Contrast', () => {
    expect(
      resolveGlassMode({
        platform: 'ios',
        liquidAvailable: true,
        apiAvailable: true,
        reduceTransparency: true,
        increaseContrast: false,
      })
    ).toBe('solid');
    expect(
      resolveGlassMode({
        platform: 'web',
        liquidAvailable: false,
        apiAvailable: false,
        reduceTransparency: false,
        increaseContrast: true,
      })
    ).toBe('solid');
  });

  it('adds alpha to hex tints so blur overlays stay translucent', () => {
    expect(colorWithAlpha('#58CC02', 0.45)).toBe('rgba(88, 204, 2, 0.45)');
  });
});
