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
import type { PerQueryOptions } from '../../../../../../query_enhancements/common';
import {
  formatPromDuration,
  parseStepIntervalSeconds,
} from '../../../../../../query_enhancements/common/prom_step';

export interface RowStepReadout {
  stepLabel: string;
  rateIntervalLabel: string;
  isFromLastRun: boolean;
}

export interface MetricsQueryOptionsProps {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  resolvedMaxDataPoints?: number;
}

export interface RowQueryOptionsProps extends RowStepReadout {
  minStep?: string;
  legendFormat?: string;
  onChange: (next: PerQueryOptions) => void;
}

export function formatStepSeconds(stepSec: number | null | undefined): string {
  if (stepSec === null || stepSec === undefined || !Number.isFinite(stepSec) || stepSec <= 0) {
    return '—';
  }
  return formatPromDuration(stepSec);
}

const minStepError = () =>
  i18n.translate('explore.metricsQueryPanel.queryOptions.minStepError', {
    defaultMessage: 'Enter a duration with a unit (ms, s, m, h, d, w, y), e.g. 15s, 1m, 2h.',
  });

const maxDataPointsError = () =>
  i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsError', {
    defaultMessage: 'Enter a whole number of 1 or more.',
  });

export const MetricsQueryOptions: React.FC<MetricsQueryOptionsProps> = ({
  maxDataPoints,
  onMaxDataPointsChange,
  resolvedMaxDataPoints,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const maxDataPointsInvalid = maxDataPoints !== undefined && maxDataPoints < 1;

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
      panelPaddingSize="s"
      anchorPosition="downLeft"
      data-test-subj="metricsQueryOptionsPopover"
    >
      <EuiForm style={{ maxWidth: 320 }}>
        <EuiFormRow
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsLabel', {
            defaultMessage: 'Max data points',
          })}
          isInvalid={maxDataPointsInvalid}
          error={maxDataPointsError()}
          helpText={i18n.translate('explore.metricsQueryPanel.queryOptions.maxDataPointsHelp', {
            defaultMessage: 'Max points per series. Shared by every query.',
          })}
        >
          <EuiFieldNumber
            compressed
            min={1}
            isInvalid={maxDataPointsInvalid}
            placeholder={
              resolvedMaxDataPoints
                ? i18n.translate(
                    'explore.metricsQueryPanel.queryOptions.maxDataPointsResolvedPlaceholder',
                    {
                      defaultMessage: 'auto = {resolved}',
                      values: { resolved: resolvedMaxDataPoints },
                    }
                  )
                : i18n.translate(
                    'explore.metricsQueryPanel.queryOptions.maxDataPointsPlaceholder',
                    {
                      defaultMessage: 'auto',
                    }
                  )
            }
            value={maxDataPoints ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = Math.floor(Number(raw));
              onMaxDataPointsChange(raw === '' || !Number.isFinite(parsed) ? undefined : parsed);
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
  stepLabel,
  rateIntervalLabel,
  isFromLastRun,
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
      panelPaddingSize="s"
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

        <EuiSpacer size="s" />
        <EuiFormRow
          label={i18n.translate('explore.metricsQueryPanel.queryOptions.minStepLabel', {
            defaultMessage: 'Min step',
          })}
          isInvalid={minStepInvalid}
          error={minStepError()}
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
          <p>
            {i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedStep', {
              defaultMessage: 'Step: {step} ($__interval)',
              values: { step: stepLabel },
            })}
            <br />
            {i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedRateInterval', {
              defaultMessage: 'Rate window: {window} ($__rate_interval)',
              values: { window: rateIntervalLabel },
            })}
            <br />
            {isFromLastRun
              ? i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedFromLastRun', {
                  defaultMessage: 'From the last run of this query.',
                })
              : i18n.translate('explore.metricsQueryPanel.queryOptions.resolvedEstimate', {
                  defaultMessage: 'Estimated; run the query to confirm.',
                })}
          </p>
        </EuiText>
      </EuiForm>
    </EuiPopover>
  );
};
