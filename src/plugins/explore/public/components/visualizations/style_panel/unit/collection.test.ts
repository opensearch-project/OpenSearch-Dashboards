/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnitsCollection, getUnitById } from './collection';

describe('UnitsCollection', () => {
  it('should contain all expected categories', () => {
    expect(UnitsCollection).toHaveProperty('misc');
    expect(UnitsCollection).toHaveProperty('currency');
    expect(UnitsCollection).toHaveProperty('data');
    expect(UnitsCollection).toHaveProperty('temperature');
    expect(UnitsCollection).toHaveProperty('time');
  });

  it('should have units with required properties', () => {
    const miscUnits = UnitsCollection.misc.units;
    expect(miscUnits[0]).toHaveProperty('id');
    expect(miscUnits[0]).toHaveProperty('name');
  });

  it('should have display functions for currency units', () => {
    const dollarUnit = UnitsCollection.currency.units.find((u) => u.id === 'dollars');
    expect(dollarUnit?.display).toBeDefined();
    expect(typeof dollarUnit?.display).toBe('function');
  });
});

describe('getUnitById', () => {
  it('should return unit by id', () => {
    const unit = getUnitById('dollars');
    expect(unit?.name).toBe('Dollars ($)');
    expect(unit?.symbol).toBe('$');
  });

  it('should return undefined for invalid id', () => {
    const unit = getUnitById('invalid');
    expect(unit).toBeUndefined();
  });

  it('should handle undefined id', () => {
    const unit = getUnitById(undefined);
    expect(unit).toBeUndefined();
  });
});
