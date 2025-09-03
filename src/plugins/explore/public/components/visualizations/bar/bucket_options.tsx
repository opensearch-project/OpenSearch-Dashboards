/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect, EuiFieldNumber } from '@elastic/eui';
import React, { useMemo } from 'react';
import { BarChartStyleControls } from './bar_vis_config';
import { AggregationType, TimeUnit, BucketOptions } from '../types';
import { getAggregationType, getTimeUnits } from '../utils/collections';
import { useDebouncedValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';
import { defaultBarChartStyles } from './bar_vis_config';

interface BucketOptionsPanelProps {
  styles: BarChartStyleControls['bucket'];
  bucketType: 'time' | 'num' | 'single' | 'cate';
  onChange: (styles: BarChartStyleControls['bucket']) => void;
}

export const BucketOptionsPanel = ({ styles, onChange, bucketType }: BucketOptionsPanelProps) => {
  const updateBucketOption = <K extends keyof BucketOptions>(key: K, value: BucketOptions[K]) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const [localBucketSize, setLocalBucketSize] = useDebouncedValue<number | undefined>(
    styles?.bucketSize,
    (val) => updateBucketOption('bucketSize', val)
  );

  const [localBucketCount, setLocalBucketCount] = useDebouncedValue<number | undefined>(
    styles?.bucketCount,
    (val) => updateBucketOption('bucketCount', val)
  );

  const labelType = useMemo(() => getAggregationType(), []);
  const timeUnits = useMemo(() => getTimeUnits(), []);

  return (
    <StyleAccordion
      id="bucketSection"
      accordionLabel={i18n.translate('explore.stylePanel.bar.tabs.bucket', {
        defaultMessage: 'Bucket',
      })}
      initialIsOpen={true}
      data-test-subj="bucketPanel"
    >
      {bucketType !== 'single' && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.bar.bucket.type', {
            defaultMessage: 'Type',
          })}
        >
          <EuiSelect
            compressed
            value={styles?.aggregationType ?? defaultBarChartStyles.bucket?.aggregationType}
            onChange={(e) =>
              updateBucketOption('aggregationType', e.target.value as AggregationType)
            }
            options={labelType}
          />
        </EuiFormRow>
      )}

      {bucketType === 'time' && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.bar.bucket.timeUnit', {
            defaultMessage: 'Interval',
          })}
        >
          <EuiSelect
            compressed
            value={styles?.bucketTimeUnit ?? defaultBarChartStyles.bucket?.bucketTimeUnit}
            onChange={(e) => updateBucketOption('bucketTimeUnit', e.target.value as TimeUnit)}
            options={timeUnits}
          />
        </EuiFormRow>
      )}

      {(bucketType === 'num' || bucketType === 'single') && (
        <>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.bar.bucket.size', {
              defaultMessage: 'Bucket Size',
            })}
          >
            <EuiFieldNumber
              compressed
              value={localBucketSize}
              onChange={(e) =>
                setLocalBucketSize(e.target.value === '' ? undefined : Number(e.target.value))
              }
              placeholder="Auto"
            />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.bar.bucket.count', {
              defaultMessage: 'Bucket Count',
            })}
            helpText="approx bucket count"
          >
            <EuiFieldNumber
              compressed
              value={localBucketCount}
              onChange={(e) =>
                setLocalBucketCount(e.target.value === '' ? undefined : Number(e.target.value))
              }
              placeholder="Default 30"
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
