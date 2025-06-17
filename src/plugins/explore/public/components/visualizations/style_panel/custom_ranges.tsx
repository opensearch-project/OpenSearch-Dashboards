/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiFormRow,
  EuiSpacer,
  EuiButtonIcon,
  EuiButton,
} from '@elastic/eui';
import { RangeValue } from '../types';

export interface RangeProps {
  index: number;
  value: RangeValue;
  onChange: (index: number, value: RangeValue) => void;
  prevMax?: number;
  onDelete: (index: number) => void;
}

export const Range: React.FC<RangeProps> = ({ index, value, onChange, prevMax, onDelete }) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, { ...value, min: Number(e.target.value) });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, { ...value, max: Number(e.target.value) });
  };

  const handleDeleteRange = () => {
    onDelete(index);
  };

  return (
    <EuiFlexGroup alignItems="center">
      <EuiFlexItem>
        <EuiFormRow label="Min">
          <EuiFieldNumber
            min={prevMax ?? 0}
            value={value.min ?? ''}
            onChange={handleMinChange}
            placeholder="Min"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow label="Max">
          <EuiFieldNumber
            min={value.min ?? 0}
            value={value.max ?? ''}
            onChange={handleMaxChange}
            placeholder="Max"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="trash"
          aria-label="Delete"
          color="danger"
          onClick={handleDeleteRange}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export interface CustomRangeProps {
  customRanges?: RangeValue[];
  onCustomRangesChange: (ranges: RangeValue[]) => void;
}

export const CustomRange: React.FC<CustomRangeProps> = ({ customRanges, onCustomRangesChange }) => {
  const [ranges, setRanges] = useState<RangeValue[]>(customRanges || []);

  const handleRangeChange = (index: number, value: RangeValue) => {
    const updated = [...ranges];
    updated[index] = value;
    setRanges(updated);
    onCustomRangesChange(updated);
  };

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newMin = lastRange?.max ?? 0;
    const newRange = { min: newMin, max: undefined };

    const updated = [...ranges, newRange];
    setRanges(updated);
    onCustomRangesChange(updated);
  };

  const handleDeleteRange = (index: number) => {
    const updated = ranges.filter((_, i) => i !== index);
    setRanges(updated);
    onCustomRangesChange(updated);
  };
  return (
    <>
      <EuiSpacer size="m" />
      {ranges.map((range, index) => {
        const prevMax = index > 0 ? ranges[index - 1].max : 0;
        return (
          <Range
            key={index}
            index={index}
            value={range}
            onChange={handleRangeChange}
            prevMax={prevMax}
            onDelete={handleDeleteRange}
          />
        );
      })}
      <EuiSpacer size="m" />
      <EuiButton onClick={handleAddRange} fill>
        + Add Range
      </EuiButton>
    </>
  );
};
