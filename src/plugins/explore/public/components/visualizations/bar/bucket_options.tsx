/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect } from '@elastic/eui';
import React, { useMemo } from 'react';
import { BarChartStyleOptions } from './bar_vis_config';
import { AggregationType, TimeUnit, BucketOptions } from '../types';
import { getAggregationType, getTimeUnits } from '../utils/collections';
import { StyleAccordion } from '../style_panel/style_accordion';
import { defaultBarChartStyles } from './bar_vis_config';
import { DebouncedFieldNumber } from '../style_panel/utils';

interface BucketOptionsPanelProps {
  styles: BarChartStyleOptions['bucket'];
  bucketType: 'time' | 'num' | 'single' | 'cate';
  onChange: (styles: BarChartStyleOptions['bucket']) => void;
}

export const BucketOptionsPanel = ({ styles, onChange, bucketType }: BucketOptionsPanelProps) => {
  const updateBucketOption = <K extends keyof BucketOptions>(key: K, value: BucketOptions[K]) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const labelType = useMemo(() => getAggregationType(), []);
  const timeUnits = useMemo(() => getTimeUnits(), []);

  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
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
            onMouseUp={(e) => e.stopPropagation()}
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
            onMouseUp={(e) => e.stopPropagation()}
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
            <DebouncedFieldNumber
              compressed
              value={styles?.bucketSize}
              placeholder="auto"
              min={0}
              onChange={(value) => updateBucketOption('bucketSize', value)}
            />
          </EuiFormRow>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.bar.bucket.count', {
              defaultMessage: 'Bucket Count',
            })}
            helpText="approx bucket count"
          >
            <DebouncedFieldNumber
              compressed
              value={styles?.bucketCount}
              min={0}
              onChange={(value) => updateBucketOption('bucketCount', value)}
              placeholder="30"
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
