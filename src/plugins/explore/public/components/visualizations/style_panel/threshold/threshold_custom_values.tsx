/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { i18n } from '@osd/i18n';
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
import { useDebouncedValue } from '../../utils/use_debounced_value';
import { getColors } from '../../theme/default_colors';
import { DebouncedFieldNumber } from '../utils';

export interface RangeProps {
  id: number;
  value: Threshold;
  onChange: (id: number, value: Threshold) => void;
  onDelete: (id: number) => void;
}

const colors = getColors();
const THRESHOLD_COLORS = [
  colors.statusGreen,
  colors.statusYellow,
  colors.statusOrange,
  colors.statusRed,
  colors.statusBlue,
];

export const Range: React.FC<RangeProps> = ({ id, value, onChange, onDelete }) => {
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
        <EuiColorPicker
          swatches={THRESHOLD_COLORS}
          color={color}
          onChange={setDebouncedColor}
          compressed
        />
      </EuiFlexItem>

      <EuiFlexItem grow={true}>
        <DebouncedFieldNumber
          compressed
          min={0}
          value={value.value}
          defaultValue={0}
          onChange={(val) => onChange(id, { ...value, value: val ?? 0 })}
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

interface ThresholdRange {
  id: number;
  threshold: Threshold;
}

export const ThresholdCustomValues: React.FC<ThresholdCustomValuesProps> = ({
  thresholds,
  onThresholdValuesChange,
  baseColor,
  onBaseColorChange,
}) => {
  const initialThresholds = thresholds || [];
  const nextIdRef = useRef(initialThresholds.length);
  const [ranges, setRanges] = useState<ThresholdRange[]>(() =>
    initialThresholds.map((threshold, id) => ({ id, threshold }))
  );

  const debouncedSortTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSort = useCallback(
    (updatedRanges: ThresholdRange[]) => {
      if (debouncedSortTimeoutRef.current) {
        clearTimeout(debouncedSortTimeoutRef.current);
      }
      debouncedSortTimeoutRef.current = setTimeout(() => {
        const sorted = [...updatedRanges].sort((a, b) => a.threshold.value - b.threshold.value);
        setRanges(sorted);
        onThresholdValuesChange(sorted.map((range) => range.threshold));
      }, 300);
    },
    [onThresholdValuesChange]
  );

  useEffect(() => {
    return () => {
      if (debouncedSortTimeoutRef.current !== null) {
        clearTimeout(debouncedSortTimeoutRef.current);
      }
    };
  }, []);

  const handleRangeChange = useCallback(
    (id: number, threshold: Threshold) => {
      const updated = ranges.map((range) => (range.id === id ? { ...range, threshold } : range));
      debouncedSort(updated);
    },
    [ranges, debouncedSort]
  );

  const handleAddRange = useCallback(() => {
    const curRangeLength = ranges.length;
    const newDefaultValue =
      curRangeLength > 0 ? Number(ranges[curRangeLength - 1].threshold.value) + 100 : 0;
    const newRange = {
      id: nextIdRef.current++,
      threshold: { value: newDefaultValue, color: getNextColor(curRangeLength + 1) },
    };

    const updated = [...ranges, newRange];
    setRanges(updated);
    onThresholdValuesChange(updated.map((range) => range.threshold));
  }, [ranges, onThresholdValuesChange]);

  const getNextColor = (rangesLength: number): string => {
    const index = rangesLength % THRESHOLD_COLORS.length;
    return THRESHOLD_COLORS[index];
  };

  const handleDeleteRange = useCallback(
    (id: number) => {
      const updated = ranges.filter((range) => range.id !== id);
      setRanges(updated);
      onThresholdValuesChange(updated.map((range) => range.threshold));
    },
    [onThresholdValuesChange, ranges]
  );

  const [localBaseColor, setLocalBaseColor] = useDebouncedValue<string>(
    baseColor,
    (val) => onBaseColorChange(val),
    300
  );

  return (
    <>
      <EuiSpacer size="s" />
      <EuiButton
        data-test-subj="exploreVisAddThreshold"
        onClick={handleAddRange}
        fullWidth
        size="s"
      >
        {i18n.translate('explore.stylePanel.thresholdPanel.addThresholdButton', {
          defaultMessage: '+ Add threshold',
        })}
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
          <EuiColorPicker
            swatches={THRESHOLD_COLORS}
            color={localBaseColor}
            onChange={setLocalBaseColor}
            compressed
          />
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
      {ranges.map((range) => {
        return (
          <Range
            key={range.id}
            id={range.id}
            value={range.threshold}
            onChange={handleRangeChange}
            onDelete={handleDeleteRange}
          />
        );
      })}
    </>
  );
};
