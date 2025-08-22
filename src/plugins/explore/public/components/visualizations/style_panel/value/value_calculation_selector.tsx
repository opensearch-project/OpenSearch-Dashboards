/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiSuperSelect, EuiText } from '@elastic/eui';
import React from 'react';

const VALUE_CALCULATION_OPTIONS = [
  {
    value: 'last',
    inputDisplay: 'Last',
    dropdownDisplay: (
      <>
        <strong>Last</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Last value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'first',
    inputDisplay: 'First',
    dropdownDisplay: (
      <>
        <strong>First</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">First value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'min',
    inputDisplay: 'Min',
    dropdownDisplay: (
      <>
        <strong>Min</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Minimum value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'max',
    inputDisplay: 'Max',
    dropdownDisplay: (
      <>
        <strong>Max</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Maximum value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'mean',
    inputDisplay: 'Mean',
    dropdownDisplay: (
      <>
        <strong>Mean</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Average value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'median',
    inputDisplay: 'Median',
    dropdownDisplay: (
      <>
        <strong>Median</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Middle value</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'variance',
    inputDisplay: 'Variance',
    dropdownDisplay: (
      <>
        <strong>Variance</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Statistical variance</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'count',
    inputDisplay: 'Count',
    dropdownDisplay: (
      <>
        <strong>Count</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Number of values</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'distinct_count',
    inputDisplay: 'Distinct count',
    dropdownDisplay: (
      <>
        <strong>Distinct count</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Number of unique values</p>
        </EuiText>
      </>
    ),
  },
  {
    value: 'total',
    inputDisplay: 'Total',
    dropdownDisplay: (
      <>
        <strong>Total</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">Sum of all values</p>
        </EuiText>
      </>
    ),
  },
];

export interface ValueCalculationSelectorProps {
  selectedValue?: string;
  onChange?: (value: string) => void;
}

export const ValueCalculationSelector = ({
  selectedValue = 'last',
  onChange = () => {},
}: ValueCalculationSelectorProps) => {
  return (
    <EuiSuperSelect
      compressed
      options={VALUE_CALCULATION_OPTIONS}
      valueOfSelected={selectedValue}
      onChange={onChange}
      hasDividers
    />
  );
};
