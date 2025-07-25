/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface PanelTitleProps {
  title: string;
  totalItems?: number;
  action?: React.ReactNode;
}

export function microToMilliSec(micro: number) {
  if (typeof micro !== 'number' || isNaN(micro)) return 0;
  return micro / 1000;
}

export function nanoToMilliSec(nano: number) {
  if (typeof nano !== 'number' || isNaN(nano)) return 0;
  return nano / 1000000;
}

export function get(obj: any, path: string, defaultValue?: any): any {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

export function isEmpty(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function round(value: number, precision: number = 0): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

export function PanelTitle({ title, totalItems, action }: PanelTitleProps) {
  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <EuiText size="m">
          <span className="panel-title">{title}</span>
          {typeof totalItems === 'number' ? (
            <span className="panel-title-count"> ({totalItems})</span>
          ) : null}
        </EuiText>
      </EuiFlexItem>
      {action && <EuiFlexItem grow={false}>{action}</EuiFlexItem>}
    </EuiFlexGroup>
  );
}

interface NoMatchMessageProps {
  traceId: string;
}

export function NoMatchMessage({ traceId }: NoMatchMessageProps) {
  return (
    <EuiCallOut
      title={i18n.translate('explore.traceView.callout.errorTitle', {
        defaultMessage: 'Error loading Trace Id: {traceId}',
        values: { traceId },
      })}
      color="danger"
      iconType="alert"
    >
      <p>
        {i18n.translate('explore.traceView.callout.errorDescription', {
          defaultMessage:
            'The Trace Id is invalid or could not be found. Please check the URL or try again.',
        })}
      </p>
    </EuiCallOut>
  );
}
