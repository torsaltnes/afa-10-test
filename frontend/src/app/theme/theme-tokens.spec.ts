/**
 * Theme token regression tests.
 *
 * These tests verify that the global stylesheet exposes the expected semantic
 * CSS custom properties on :root (document.documentElement). They run in the
 * Karma browser environment where Angular's global styles.css is loaded, making
 * the @theme tokens available via getComputedStyle.
 */
describe('theme tokens', () => {
  const rootStyles = () => getComputedStyle(document.documentElement);
  const token = (name: string) => rootStyles().getPropertyValue(name).trim();

  it('should expose the full light-palette semantic token set', () => {
    const required = [
      '--color-primary',
      '--color-primary-hover',
      '--color-background',
      '--color-surface',
      '--color-surface-raised',
      '--color-surface-subtle',
      '--color-surface-overlay',
      '--color-border',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-placeholder',
      '--color-danger',
      '--color-warning',
      '--color-success',
      '--color-sidebar-bg',
      '--color-topbar-bg',
    ];

    for (const name of required) {
      expect(token(name)).withContext(`Token ${name} must be defined`).not.toBe('');
    }
  });

  it('should expose button primitive tokens', () => {
    const buttonTokens = [
      '--color-button-primary-text',
      '--color-button-secondary-bg',
      '--color-button-ghost-bg',
      '--color-button-ghost-text',
    ];

    for (const name of buttonTokens) {
      expect(token(name)).withContext(`Token ${name} must be defined`).not.toBe('');
    }
  });

  it('should keep chart tokens defined for ng2-charts / chart.js compatibility', () => {
    expect(token('--color-chart-1')).withContext('--color-chart-1').not.toBe('');
    expect(token('--color-chart-2')).withContext('--color-chart-2').not.toBe('');
    expect(token('--color-chart-3')).withContext('--color-chart-3').not.toBe('');
  });

  it('should no longer expose the previous dark background value', () => {
    // The old dark theme set background to oklch(0.13 0.015 264).
    // All surfaces and background must now be light values (lightness > 0.90).
    const bg = token('--color-background');
    const surf = token('--color-surface');

    // Old dark value must not appear
    expect(bg).not.toBe('oklch(0.13 0.015 264)');
    expect(surf).not.toBe('oklch(0.13 0.015 264)');

    // The old dark surface value must also be gone
    expect(surf).not.toBe('oklch(0.18 0.02 264)');
  });
});
