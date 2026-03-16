/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiSpacer, EuiText, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { resolveServiceNameFromSpan } from '../traces/ppl_resolve_helpers';
import { Dataset } from '../../../../../../../../data/common';
import { getMissingFieldsDescription } from '../../../../../../utils/trace_field_validation';

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

export function getServiceInfo(selectedSpan: any, traceId?: string, isLoading?: boolean): string {
  if (isLoading) {
    return i18n.translate('explore.traceDetails.header.loading', {
      defaultMessage: 'Loading trace...',
    });
  }

  if (selectedSpan) {
    const serviceName =
      resolveServiceNameFromSpan(selectedSpan) ||
      i18n.translate('explore.traceDetails.header.unknownService', {
        defaultMessage: 'Unknown Service',
      });
    const operationName =
      selectedSpan.name ||
      i18n.translate('explore.traceDetails.header.unknownOperation', {
        defaultMessage: 'Unknown Operation',
      });
    return `${serviceName}: ${operationName}`;
  } else if (traceId) {
    return i18n.translate('explore.traceDetails.header.unknownTrace', {
      defaultMessage: 'Unknown Trace',
    });
  }
  return '';
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

interface MissingFieldsEmptyStateProps {
  missingFields: string[];
  dataset?: Dataset;
  workspaceId?: string;
}

export function MissingFieldsEmptyState({
  missingFields,
  dataset,
  workspaceId,
}: MissingFieldsEmptyStateProps) {
  return (
    <div style={{ padding: '24px' }}>
      <EuiCallOut
        title={i18n.translate('explore.traceDetails.missingFields.title', {
          defaultMessage: 'Unable to display trace detail',
        })}
        color="warning"
        iconType="iInCircle"
      >
        <EuiText size="s">
          <p>
            {i18n.translate('explore.traceDetails.missingFields.description', {
              defaultMessage:
                'The trace detail page cannot be displayed due to missing fields from the ',
            })}
            <EuiLink
              href="https://github.com/opensearch-project/data-prepper/blob/main/data-prepper-plugins/opensearch/src/main/resources/index-template/otel-v1-apm-span-index-standard-template.json"
              target="_blank"
              external
            >
              {i18n.translate('explore.traceDetails.missingFields.schemaLink', {
                defaultMessage: 'Data-Prepper OTel schema',
              })}
            </EuiLink>
            {i18n.translate('explore.traceDetails.missingFields.descriptionContinued', {
              defaultMessage:
                '. We recommend checking the source data or dataset for missing or improperly mapped fields.',
            })}
          </p>
        </EuiText>

        <EuiSpacer size="m" />

        <EuiText size="s">
          <p>
            <strong>
              {i18n.translate('explore.traceDetails.missingFields.missingFieldsLabel', {
                defaultMessage: 'Missing fields:',
              })}
            </strong>
          </p>
        </EuiText>

        <EuiSpacer size="s" />

        <EuiText size="s">
          <div>
            {getMissingFieldsDescription(missingFields).map((field, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <strong>{field.name}</strong> - {field.description}
              </div>
            ))}
          </div>
        </EuiText>
      </EuiCallOut>
    </div>
  );
}
