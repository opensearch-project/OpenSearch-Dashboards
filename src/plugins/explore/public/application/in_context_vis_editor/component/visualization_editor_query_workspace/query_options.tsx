/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFocusTrap,
  EuiFormRow,
  EuiIconTip,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './query_workspace.scss';

const autoLabel = i18n.translate('explore.queryWorkspace.queryOptions.auto', {
  defaultMessage: 'auto',
});

const maxDataPointsLabel = i18n.translate('explore.queryWorkspace.queryOptions.maxDataPoints', {
  defaultMessage: 'Max data points',
});

// The form names the scope: only PromQL (Prometheus) queries use max data points.
const maxDataPointsFormLabel = i18n.translate(
  'explore.queryWorkspace.queryOptions.maxDataPointsFormLabel',
  {
    defaultMessage: 'Max data points',
  }
);

export interface QueryOptionsBarProps {
  isOpen: boolean;
  maxDataPoints?: number;
  onToggle: () => void;
}

export const QueryOptionsBar = ({ isOpen, maxDataPoints, onToggle }: QueryOptionsBarProps) => (
  <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
    <EuiFlexItem grow={false}>
      <EuiButtonEmpty
        size="xs"
        iconType={isOpen ? 'arrowUp' : 'arrowDown'}
        iconSide="right"
        onClick={onToggle}
        aria-expanded={isOpen}
        data-test-subj="queryOptionsToggle"
      >
        {i18n.translate('explore.queryWorkspace.queryOptions.title', {
          defaultMessage: 'Query options',
        })}
      </EuiButtonEmpty>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size="xs" color="subdued">
        {maxDataPointsLabel}{' '}
        <span data-test-subj="queryOptionsMaxDataPointsValue">{maxDataPoints ?? autoLabel}</span>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

export interface QueryOptionsOverlayProps {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  onClose: () => void;
}

// A whole number of 1 or more; empty means auto.
const parseMaxDataPoints = (text: string): { value?: number; isValid: boolean } => {
  if (!text.trim()) return { value: undefined, isValid: true };
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 ? { value, isValid: true } : { isValid: false };
};

export const QueryOptionsOverlay = ({
  maxDataPoints,
  onMaxDataPointsChange,
  onClose,
}: QueryOptionsOverlayProps) => {
  const [text, setText] = useState(maxDataPoints === undefined ? '' : String(maxDataPoints));
  useEffect(() => {
    setText(maxDataPoints === undefined ? '' : String(maxDataPoints));
  }, [maxDataPoints]);
  const { isValid } = parseMaxDataPoints(text);

  return (
    <div
      className="queryWorkspaceQueryOptions__overlay"
      data-test-subj="queryOptionsOverlay"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <EuiFocusTrap className="queryWorkspaceQueryOptions__form">
        <EuiFormRow
          label={
            <span>
              {maxDataPointsFormLabel}{' '}
              <EuiIconTip
                type="iInCircle"
                size="s"
                content={i18n.translate('explore.queryWorkspace.queryOptions.maxDataPointsHelp', {
                  defaultMessage:
                    'Max points per series, shared by every query. Applies to PromQL queries. Empty = auto.',
                })}
              />
            </span>
          }
          isInvalid={!isValid}
          error={i18n.translate('explore.queryWorkspace.queryOptions.maxDataPointsError', {
            defaultMessage: 'Enter a whole number of 1 or more.',
          })}
          display="columnCompressed"
        >
          <EuiFieldNumber
            compressed
            min={1}
            value={text}
            placeholder={autoLabel}
            isInvalid={!isValid}
            onChange={(event) => {
              setText(event.target.value);
              const parsed = parseMaxDataPoints(event.target.value);
              if (parsed.isValid) onMaxDataPointsChange(parsed.value);
            }}
            data-test-subj="queryOptionsMaxDataPointsInput"
          />
        </EuiFormRow>
      </EuiFocusTrap>
      {/* Clicking beside the form closes it. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        className="queryWorkspaceQueryOptions__backdrop"
        onClick={onClose}
        data-test-subj="queryOptionsBackdrop"
      />
    </div>
  );
};
