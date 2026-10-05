/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
  SpanAttributeFilter,
  coerceFilterValue,
  distinctFieldValues,
} from './span_attribute_filter';

describe('coerceFilterValue', () => {
  it('coerces numeric fields to numbers', () => {
    expect(coerceFilterValue('200', 'number')).toBe(200);
    expect(coerceFilterValue('abc', 'number')).toBe('abc'); // non-numeric stays string
  });
  it('coerces boolean fields', () => {
    expect(coerceFilterValue('true', 'boolean')).toBe(true);
    expect(coerceFilterValue('false', 'boolean')).toBe(false);
  });
  it('leaves other types as strings', () => {
    expect(coerceFilterValue('cart', 'string')).toBe('cart');
    expect(coerceFilterValue('cart')).toBe('cart');
  });
});

describe('distinctFieldValues', () => {
  const spans = [
    { serviceName: 'cart', attributes: { http: { method: 'GET' } } },
    { serviceName: 'cart', attributes: { http: { method: 'POST' } } },
    { serviceName: 'payment', attributes: { http: { method: 'GET' } } },
    { serviceName: undefined },
  ];
  it('returns distinct, sorted, stringified values (top-level + nested)', () => {
    expect(distinctFieldValues(spans, 'serviceName')).toEqual(['cart', 'payment']);
    expect(distinctFieldValues(spans, 'attributes.http.method')).toEqual(['GET', 'POST']);
  });
  it('caps the number of values', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    expect(distinctFieldValues(many, 'id', 10)).toHaveLength(10);
  });
});

describe('SpanAttributeFilter', () => {
  const fields = [
    { name: 'serviceName', type: 'string' },
    { name: 'status.code', type: 'number' },
  ];

  it('renders the "+ Add filter" trigger and opens a popover with the dataset help text', () => {
    const { getByTestId, getByText } = render(
      <SpanAttributeFilter fields={fields} spans={[]} onAddFilter={jest.fn()} />
    );
    fireEvent.click(getByTestId('span-attribute-filter-button'));
    expect(getByText('Fields are loaded from the dataset field list.')).toBeInTheDocument();
    // Add is disabled until a field + value are chosen.
    expect(getByTestId('span-attribute-filter-apply').closest('button')).toBeDisabled();
  });
});
