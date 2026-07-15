import { describe, expect, it } from 'vitest';
import { estimateRouteCost, formatRouteCost } from './routeCost.utils';

describe('route cost', () => {
  it('preserves transit fare currency instead of assuming won', () => {
    expect(estimateRouteCost('TRANSIT', 1000, { value: 2.5, currency: 'USD' })).toMatchObject({ amount: 2.5, currency: 'USD' });
    expect(formatRouteCost(2.5, 'USD')).toContain('$2.50');
  });

  it('does not create a walking fare', () => {
    expect(estimateRouteCost('WALKING', 1000)).toEqual({ amount: 0, note: '' });
  });
});
