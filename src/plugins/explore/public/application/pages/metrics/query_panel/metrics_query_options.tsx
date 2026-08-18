/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiFieldNumber,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';

export interface MetricsStepSettingsValue {
  maxDataPoints?: number;
  minStep?: string;
}

export interface MetricsQueryOptionsProps extends MetricsStepSettingsValue {
  resolvedStepLabel: string;
  minStepInvalid: boolean;
  onStepSettingsChange: (next: MetricsStepSettingsValue) => void;
}

export function formatStepSeconds(stepSec: number | null): string {
  if (stepSec === null || !Number.isFinite(stepSec) || stepSec <= 0) return '—';
  const units: Array<[number, string]> = [
    [3600, 'h'],
    [60, 'm'],
    [1, 's'],
  ];
  let remaining = Math.round(stepSec);
  const parts: string[] = [];
  for (const [size, suffix] of units) {
    const value = Math.floor(remaining / size);
    if (value > 0) {
      parts.push(`${value}${suffix}`);
      remaining -= value * size;
    }
  }
  return parts.join(' ') || '0s';
}

export const MetricsQueryOptions: React.FC<MetricsQueryOptionsProps> = ({
  maxDataPoints,
  minStep,
  resolvedStepLabel,
  minStepInvalid,
  onStepSettingsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const button = (
    <EuiButtonEmpty
      size="xs"
      iconType="gear"
      onClick={() => setIsOpen((open) => !open)}
      data-test-subj="metricsQueryOptionsButton"
    >
      {i18n.translate('explore.metricsQueryPanel.queryOptions.buttonLabel', {
        defaultMessage: 'Query options',
      })}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downLeft"
      data-test-subj="metricsQueryOptionsPopover"
    >
      <EuiForm style={{ maxWidth: 320 }}>
        <EuiFormRow
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.minStepLabel', {
            defaultMessage: 'Min step',
          })}
          isInvalid={minStepInvalid}
          error={i18n.translate('explore.metricsQueryPanel.queryOptions.minStepError', {
            defaultMessage:
              'Enter a duration with a unit (ms, s, m, h, d, w, y), e.g. 15s, 1m, 2h.',
          })}
          helpText={i18n.translate('explore.metricsQueryPanel.queryOptions.minStepHelp', {
            defaultMessage:
              'Lower bound on the step. Align to your metric publication interval (e.g. 60s) to avoid repeated values.',
          })}
        >
          <EuiFieldText
            compressed
            isInvalid={minStepInvalid}
            placeholder="15s"
            value={minStep ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onStepSettingsChange({ maxDataPoints, minStep: raw === '' ? undefined : raw });
            }}
            data-test-subj="metricsStepMinStepInput"
          />
        </EuiFormRow>

        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued" data-test-subj="metricsStepResolved">
          {i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedStep', {
            defaultMessage: 'Resolved step for the current time range: {step}',
            values: { step: resolvedStepLabel },
          })}
        </EuiText>

        <EuiSpacer size="m" />
        <EuiFormRow
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsLabel', {
            defaultMessage: 'Max data points',
          })}
          helpText={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsHelp', {
            defaultMessage:
              'Caps points per series so long time ranges stay under payload limits. Leave empty for auto ({defaultResolution}).',
            values: { defaultResolution: 1440 },
          })}
        >
          <EuiFieldNumber
            compressed
            min={1}
            placeholder={i18n.translate(
              'explore.metricsQueryPanel.queryOptions.maxDataPointsPlaceholder',
              { defaultMessage: 'auto' }
            )}
            value={maxDataPoints ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onStepSettingsChange({
                maxDataPoints: raw === '' ? undefined : Math.floor(Number(raw)),
                minStep,
              });
            }}
            data-test-subj="metricsStepMaxDataPointsInput"
          />
        </EuiFormRow>

        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued">
          {i18n.translate('explore.metricsQueryPanel.queryOptions.macrosNote', {
            defaultMessage:
              'Use $__rate_interval inside rate() and $__interval elsewhere to size range windows to the resolved step, so series do not gap when the time range widens.',
          })}
        </EuiText>

        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued">
          {i18n.translate('explore.metricsQueryPanel.queryOptions.stepVsBucketNote', {
            defaultMessage:
              'The step controls the resolution Prometheus computes on the server. It is not the same as the legacy visualization "Bucket interval", which re-buckets points after they are returned.',
          })}
        </EuiText>
      </EuiForm>
    </EuiPopover>
  );
};
