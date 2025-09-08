/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiButtonIcon,
  EuiButton,
  EuiSpacer,
  EuiColorPicker,
} from '@elastic/eui';
import { Threshold } from '../../types';
import { useDebouncedValue, useDebouncedNumericValue } from '../../utils/use_debounced_value';

export interface RangeProps {
  id: number;
  value: Threshold;
  onChange: (index: number, value: Threshold) => void;
  onDelete: (index: number) => void;
}

export const Range: React.FC<RangeProps> = ({ id, value, onChange, onDelete }) => {
  const [thresholdValue, setThresholdValue] = useDebouncedNumericValue(value.value, (val) =>
    onChange(id, { ...value, value: val })
  );

  const [color, setDebouncedColor] = useDebouncedValue<string>(
    value.color,
    (val) => onChange(id, { ...value, color: val }),
    300
  );

  const handleDeleteRange = () => {
    onDelete(id);
  };

  return (
    <EuiFlexGroup
      alignItems="center"
      justifyContent="center"
      gutterSize="s"
      data-test-subj={`exploreVisThreshold-${id}`}
    >
      <EuiFlexItem>
        <EuiColorPicker color={color} onChange={setDebouncedColor} compressed />
      </EuiFlexItem>

      <EuiFlexItem grow={true}>
        <EuiFieldNumber
          compressed
          min={0}
          value={thresholdValue}
          onChange={(e) => setThresholdValue((e.target as HTMLInputElement).value)}
          placeholder="Value"
          data-test-subj={`exploreVisThresholdValue-${id}`}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          size="xs"
          iconType="trash"
          aria-label="Delete"
          color="danger"
          onClick={handleDeleteRange}
          data-test-subj={`exploreVisThresholdDeleteButton-${id}`}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export interface ThresholdCustomValuesProps {
  thresholds: Threshold[];
  onThresholdValuesChange: (ranges: Threshold[]) => void;
  baseColor: string;
  onBaseColorChange: (color: string) => void;
}

export const ThresholdCustomValues: React.FC<ThresholdCustomValuesProps> = ({
  thresholds,
  onThresholdValuesChange,
  baseColor,
  onBaseColorChange,
}) => {
  const [ranges, setRanges] = useState<Threshold[]>(thresholds || []);

  const handleRangeChange = (index: number, value: Threshold) => {
    const updated = [...ranges];
    updated[index] = value;
    const sorted = updated.sort((a, b) => a.value - b.value);
    setRanges(sorted);
    onThresholdValuesChange(sorted);
  };

  const handleAddRange = () => {
    const curRangeLength = ranges.length;
    const newDefaultValue = curRangeLength > 0 ? Number(ranges[curRangeLength - 1].value) + 10 : 0;
    const newRange = { value: newDefaultValue, color: getNextColor(curRangeLength) };

    const updated = [...ranges, newRange];
    const sorted = updated.sort((a, b) => a.value - b.value);
    setRanges(sorted);
    onThresholdValuesChange(sorted);
  };

  const getNextColor = (rangesLength: number): string => {
    // TODO: update to use the colors from color palette
    const colors = ['#54B399', '#FFA800', '#DB0000', '#6092C0', '#D36086', '#9170B8'];
    const index = rangesLength % colors.length;
    return colors[index];
  };

  const handleDeleteRange = (index: number) => {
    const updated = ranges.filter((_, i) => i !== index);
    setRanges(updated);
    onThresholdValuesChange(updated);
  };

  const [localBaseColor, setLocalBaseColor] = useDebouncedValue<string>(
    baseColor,
    (val) => onBaseColorChange(val),
    300
  );

  return (
    <>
      <EuiSpacer size="s" />
      <EuiButton onClick={handleAddRange} fullWidth size="s">
        + Add threshold
      </EuiButton>
      <EuiSpacer size="s" />
      {/*  placeholder for base threshold */}
      <EuiFlexGroup
        alignItems="center"
        justifyContent="center"
        gutterSize="s"
        data-test-subj="exploreVisThresholdBaseColor"
      >
        <EuiFlexItem>
          <EuiColorPicker color={localBaseColor} onChange={setLocalBaseColor} compressed />
        </EuiFlexItem>

        <EuiFlexItem grow={true}>
          <EuiFieldNumber compressed value={undefined} placeholder="Base" disabled />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            size="xs"
            iconType="trash"
            aria-label="Delete"
            color="danger"
            // base threshold should not be deleted
            isDisabled={true}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {ranges.map((range, index) => {
        return (
          <Range
            key={index}
            id={index}
            value={range}
            onChange={handleRangeChange}
            onDelete={handleDeleteRange}
          />
        );
      })}
    </>
  );
};
