import { describe, it, expect } from 'vitest';
import { isNavItemActive } from '@/components/Header';

/**
 * The active-page indicator is driven entirely by this predicate, and its
 * interesting cases are all edges: nested routes, the root, and the hash link
 * that sits in the same nav array but isn't a page at all.
 */
describe('isNavItemActive', () => {
  it('marks the exact page', () => {
    expect(isNavItemActive('/programs', '/programs')).toBe(true);
    expect(isNavItemActive('/about', '/about')).toBe(true);
  });

  it('keeps the section lit on nested routes', () => {
    // Losing the indicator here would drop it exactly when a visitor has gone
    // deepest and most needs to know where they are.
    expect(isNavItemActive('/programs', '/programs/workshop')).toBe(true);
    expect(isNavItemActive('/stories', '/stories/anusha')).toBe(true);
    expect(isNavItemActive('/tools', '/tools/niche-finder')).toBe(true);
  });

  it('does not match a different section that merely shares a prefix', () => {
    expect(isNavItemActive('/tool', '/tools')).toBe(false);
    expect(isNavItemActive('/programs', '/programs-archive')).toBe(false);
  });

  it('never marks a hash link as the current page', () => {
    // `/#faq` is a position on the homepage, not a page of its own.
    expect(isNavItemActive('/#faq', '/')).toBe(false);
    expect(isNavItemActive('/#faq', '/#faq')).toBe(false);
  });

  it('only matches the root on the root', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/', '/about')).toBe(false);
  });

  it('leaves unrelated items inactive', () => {
    expect(isNavItemActive('/about', '/programs')).toBe(false);
  });
});
