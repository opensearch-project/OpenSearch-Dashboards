/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiCopy,
  EuiSmallButtonIcon,
  EuiTitle,
  EuiSpacer,
  EuiLink,
  EuiBadge,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { nanoToMilliSec, isEmpty, round } from '../../utils/helper_functions';
import { extractSpanDuration, extractHttpStatusCode } from '../../utils/span_data_utils';
import { isSpanError, resolveServiceNameFromSpan } from '../ppl_resolve_helpers';
import './span_tabs.scss';

export interface SpanOverviewTabProps {
  selectedSpan?: any;
  onSwitchToErrorsTab?: () => void;
}

interface OverviewFieldProps {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  copyValue?: string;
}

const OverviewField: React.FC<OverviewFieldProps> = ({
  label,
  value,
  copyable = false,
  copyValue,
}) => (
  <div>
    <EuiText size="s">
      <strong>{label}</strong>
    </EuiText>
    <EuiSpacer size="xs" />
    {copyable && copyValue ? (
      <EuiFlexGroup gutterSize="xs" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiCopy textToCopy={copyValue}>
            {(copy) => (
              <EuiSmallButtonIcon
                aria-label={i18n.translate('explore.spanOverviewTab.copyToClipboard', {
                  defaultMessage: 'Copy to clipboard',
                })}
                onClick={copy}
                iconType="copyClipboard"
              />
            )}
          </EuiCopy>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s" color="default">
            {value}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ) : (
      <EuiText size="s" color="default">
        {value}
      </EuiText>
    )}
  </div>
);

export const SpanOverviewTab: React.FC<SpanOverviewTabProps> = ({
  selectedSpan,
  onSwitchToErrorsTab,
}) => {
  const getStatusCodeColor = (statusCode: number | undefined): string => {
    if (!statusCode) return 'default';

    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'primary';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500 && statusCode < 600) return 'danger';
    return 'default';
  };

  const spanData = useMemo(() => {
    if (!selectedSpan || isEmpty(selectedSpan)) {
      return null;
    }

    const spanId = selectedSpan.spanId;
    const serviceName = resolveServiceNameFromSpan(selectedSpan);
    const operation = selectedSpan.name;
    const duration = extractSpanDuration(selectedSpan);
    const startTime = selectedSpan.startTime;
    const hasError = isSpanError(selectedSpan);

    // Extract HTTP-specific attributes
    const httpMethod =
      selectedSpan.attributes?.['http.method'] || selectedSpan.attributes?.['http.request.method'];
    const httpUrl = selectedSpan.attributes?.['http.url'] || selectedSpan.attributes?.['url.full'];
    const httpStatusCode = extractHttpStatusCode(selectedSpan);

    return {
      spanId,
      serviceName,
      operation,
      duration,
      startTime,
      hasError,
      httpMethod,
      httpUrl,
      httpStatusCode,
    };
  }, [selectedSpan]);

  if (!selectedSpan || isEmpty(selectedSpan) || !spanData) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanOverviewTab.noSpanSelected', {
          defaultMessage: 'No span selected',
        })}
      </EuiText>
    );
  }

  const {
    spanId,
    serviceName,
    operation,
    duration,
    startTime,
    hasError,
    httpMethod,
    httpUrl,
    httpStatusCode,
  } = spanData;

  return (
    <div>
      {/* Basic Information Section */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <OverviewField
            label={i18n.translate('explore.spanOverviewTab.serviceIdentifier', {
              defaultMessage: 'Service identifier',
            })}
            value={serviceName || '-'}
            copyable={!!serviceName}
            copyValue={serviceName}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <OverviewField
            label={i18n.translate('explore.spanOverviewTab.spanId', {
              defaultMessage: 'Span ID',
            })}
            value={spanId || '-'}
            copyable={!!spanId}
            copyValue={spanId}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <OverviewField
            label={i18n.translate('explore.spanOverviewTab.startTime', {
              defaultMessage: 'Start time',
            })}
            value={
              startTime
                ? `${moment(startTime).format('MMM D')} @ ${moment(startTime).format(
                    'HH:mm:ss.SSS'
                  )} (${round(nanoToMilliSec(duration || 0), 0)}ms)`
                : '-'
            }
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <OverviewField
            label={i18n.translate('explore.spanOverviewTab.spanStatus', {
              defaultMessage: 'Span status',
            })}
            value={
              <EuiFlexGroup gutterSize="xs" alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiIcon type="dot" color={hasError ? 'danger' : 'success'} size="s" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    {hasError
                      ? i18n.translate('explore.spanOverviewTab.error', {
                          defaultMessage: 'Error',
                        })
                      : i18n.translate('explore.spanOverviewTab.ok', {
                          defaultMessage: 'OK',
                        })}
                  </EuiText>
                </EuiFlexItem>
                {hasError && onSwitchToErrorsTab && (
                  <EuiFlexItem grow={false}>
                    <EuiLink color="primary" onClick={onSwitchToErrorsTab}>
                      {i18n.translate('explore.spanOverviewTab.viewErrors', {
                        defaultMessage: 'View errors',
                      })}
                    </EuiLink>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Requests & Response Section */}
      {(httpUrl || httpMethod || httpStatusCode) && (
        <>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('explore.spanOverviewTab.request', {
                defaultMessage: 'Request',
              })}
            </h3>
          </EuiTitle>
          <EuiSpacer size="m" />

          {httpUrl && (
            <>
              <EuiText size="s">
                <strong>
                  {i18n.translate('explore.spanOverviewTab.requestUrl', {
                    defaultMessage: 'Request URL',
                  })}
                </strong>
              </EuiText>
              <EuiSpacer size="xs" />
              <EuiFlexGroup gutterSize="xs" alignItems="flexStart">
                <EuiFlexItem grow={false}>
                  <EuiCopy textToCopy={httpUrl}>
                    {(copy) => (
                      <EuiSmallButtonIcon
                        aria-label={i18n.translate('explore.spanOverviewTab.copyToClipboard', {
                          defaultMessage: 'Copy to clipboard',
                        })}
                        onClick={copy}
                        iconType="copyClipboard"
                      />
                    )}
                  </EuiCopy>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiLink
                    href={httpUrl}
                    target="_blank"
                    external
                    className="exploreSpanTabs__urlLink"
                  >
                    {httpUrl}
                  </EuiLink>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="m" />
            </>
          )}

          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <OverviewField
                label={i18n.translate('explore.spanOverviewTab.requestMethod', {
                  defaultMessage: 'Request method',
                })}
                value={httpMethod || operation || '-'}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <OverviewField
                label={i18n.translate('explore.spanOverviewTab.requestCode', {
                  defaultMessage: 'Request code',
                })}
                value={
                  httpStatusCode ? (
                    <EuiBadge color={getStatusCodeColor(httpStatusCode)}>{httpStatusCode}</EuiBadge>
                  ) : hasError ? (
                    <EuiBadge color="danger">
                      {i18n.translate('explore.spanOverviewTab.error', {
                        defaultMessage: 'Error',
                      })}
                    </EuiBadge>
                  ) : (
                    <EuiBadge color="success">
                      {i18n.translate('explore.spanOverviewTab.success', {
                        defaultMessage: 'Success',
                      })}
                    </EuiBadge>
                  )
                }
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </div>
  );
};
