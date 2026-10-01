import { estimateTotal, unitPriceWithOptions } from './pre-order-pricing.util';

describe('unitPriceWithOptions', () => {
  it('adds the delta to a fixed price', () => {
    expect(unitPriceWithOptions({ type: 'fixed', amount: 100 }, 25)).toEqual({ type: 'fixed', amount: 125 });
  });

  it('adds the delta to both bounds of a range price', () => {
    expect(unitPriceWithOptions({ type: 'range', min: 100, max: 200 }, 50)).toEqual({
      type: 'range',
      min: 150,
      max: 250,
    });
  });

  it('floors each component at 0 for large negative deltas', () => {
    expect(unitPriceWithOptions({ type: 'fixed', amount: 100 }, -500)).toEqual({ type: 'fixed', amount: 0 });
    expect(unitPriceWithOptions({ type: 'range', min: 100, max: 200 }, -150)).toEqual({
      type: 'range',
      min: 0,
      max: 50,
    });
  });

  it('leaves on_request pricing untouched', () => {
    expect(unitPriceWithOptions({ type: 'on_request' }, 100)).toEqual({ type: 'on_request' });
  });
});

describe('estimateTotal', () => {
  it('sums fixed-price items (min = max)', () => {
    expect(
      estimateTotal([
        { unitPrice: { type: 'fixed', amount: 100 }, quantity: 2 },
        { unitPrice: { type: 'fixed', amount: 50 }, quantity: 1 },
      ]),
    ).toEqual({ min: 250, max: 250 });
  });

  it('sums min/max separately for range items', () => {
    expect(estimateTotal([{ unitPrice: { type: 'range', min: 100, max: 200 }, quantity: 2 }])).toEqual({
      min: 200,
      max: 400,
    });
  });

  it('returns null if any item is on_request', () => {
    expect(
      estimateTotal([
        { unitPrice: { type: 'fixed', amount: 100 }, quantity: 1 },
        { unitPrice: { type: 'on_request' }, quantity: 1 },
      ]),
    ).toBeNull();
  });
});
