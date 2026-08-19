/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldNumber,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { PerQueryOptions } from '../../../utils/languages';
import { parseStepIntervalSeconds } from '../prom_step';

export interface MetricsQueryOptionsProps {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
}

export interface RowQueryOptionsProps {
  minStep?: string;
  legendFormat?: string;
  resolvedStepLabel: string;
  onChange: (next: PerQueryOptions) => void;
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
  onMaxDataPointsChange,
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
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsLabel', {
            defaultMessage: 'Max data points',
          })}
          helpText={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsHelp', {
            defaultMessage: 'Max points per series.',
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
              onMaxDataPointsChange(raw === '' ? undefined : Math.floor(Number(raw)));
            }}
            data-test-subj="metricsStepMaxDataPointsInput"
          />
        </EuiFormRow>
      </EuiForm>
    </EuiPopover>
  );
};

export const RowQueryOptions: React.FC<RowQueryOptionsProps> = ({
  minStep,
  legendFormat,
  resolvedStepLabel,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const minStepInvalid = !!minStep && parseStepIntervalSeconds(minStep) === undefined;

  const button = (
    <EuiButtonIcon
      iconType="gear"
      color="text"
      size="s"
      onClick={() => setIsOpen((open) => !open)}
      aria-label={i18n.translate('explore.metricsQueryPanel.queryOptions.rowButtonLabel', {
        defaultMessage: 'Query options',
      })}
      data-test-subj="metricsRowQueryOptionsButton"
    />
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downRight"
      data-test-subj="metricsRowQueryOptionsPopover"
    >
      <EuiForm style={{ maxWidth: 320 }}>
        <EuiFormRow
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.legendFormatLabel', {
            defaultMessage: 'Series name',
          })}
          helpText={i18n.translate('explore.metricsQueryPanel.queryOptions.legendFormatHelp', {
            defaultMessage: 'Name series from labels, e.g. {example} or {combo}.',
            values: { example: '{{label}}', combo: '{{label1}}-{{label2}}' },
          })}
        >
          <EuiFieldText
            compressed
            placeholder="{{label}}"
            value={legendFormat ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({ minStep, legendFormat: raw === '' ? undefined : raw });
            }}
            data-test-subj="metricsLegendFormatInput"
          />
        </EuiFormRow>

        <EuiSpacer size="m" />
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
            defaultMessage: 'Lower bound on the step. Match your scrape interval.',
          })}
        >
          <EuiFieldText
            compressed
            isInvalid={minStepInvalid}
            placeholder="15s"
            value={minStep ?? ''}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onChange({ minStep: raw === '' ? undefined : raw, legendFormat });
            }}
            data-test-subj="metricsStepMinStepInput"
          />
        </EuiFormRow>

        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued" data-test-subj="metricsStepResolved">
          {i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedStep', {
            defaultMessage: 'Step for current range: {step}',
            values: { step: resolvedStepLabel },
          })}
        </EuiText>
      </EuiForm>
    </EuiPopover>
  );
};
