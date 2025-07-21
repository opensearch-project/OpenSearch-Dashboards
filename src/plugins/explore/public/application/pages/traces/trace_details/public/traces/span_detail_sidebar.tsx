/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiHorizontalRule,
  EuiCodeBlock,
  EuiCopy,
  EuiSmallButtonIcon,
  EuiToolTip,
  EuiSmallButton,
  EuiButtonEmpty,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { nanoToMilliSec, get, isEmpty, round } from '../utils/helper_functions';
import { FlyoutListItem } from './flyout_list_item';
import { TRACE_ANALYTICS_DATE_FORMAT } from '../utils/shared_const';

export type SpanField =
  | 'SPAN_ID'
  | 'PARENT_SPAN_ID'
  | 'SERVICE'
  | 'OPERATION'
  | 'DURATION'
  | 'START_TIME'
  | 'END_TIME'
  | 'ERRORS';

const SPAN_FIELDS: Record<SpanField, string | undefined> = {
  SPAN_ID: 'spanId',
  PARENT_SPAN_ID: 'parentSpanId',
  SERVICE: 'serviceName',
  OPERATION: 'name',
  DURATION: 'durationInNanos',
  START_TIME: 'startTime',
  END_TIME: 'endTime',
  ERRORS: 'status.code',
};

const flattenObject = (
  obj: any,
  prefix = '',
  result: Record<string, any> = {}
): Record<string, any> => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
};

const getSpanFieldKey = (field: SpanField) => SPAN_FIELDS[field];

const getSpanValue = (span: object, field: SpanField) => {
  const fieldKey = getSpanFieldKey(field);
  if (fieldKey === undefined) return undefined;
  return get(span, fieldKey);
};

export interface SpanDetailSidebarProps {
  selectedSpan?: any;
  addSpanFilter: (field: string, value: any) => void;
  serviceName?: string;
  setCurrentSpan?: (spanId: string) => void;
}

export const SpanDetailSidebar: React.FC<SpanDetailSidebarProps> = ({
  selectedSpan,
  addSpanFilter,
  serviceName,
  setCurrentSpan,
}) => {
  const getListItem = (
    fieldKey: string | undefined,
    title: React.ReactNode,
    description: React.ReactNode
  ) => {
    return (
      <FlyoutListItem
        title={title}
        description={description}
        key={`list-item-${title}`}
        addSpanFilter={
          fieldKey
            ? () => addSpanFilter(fieldKey, get(flattenObject(selectedSpan), fieldKey))
            : undefined
        }
      />
    );
  };

  const _isEmpty = (value: any) => {
    return (
      value == null ||
      (value.hasOwnProperty('length') && value.length === 0) ||
      (value.constructor === Object && Object.keys(value).length === 0)
    );
  };

  const renderContent = () => {
    if (!selectedSpan || isEmpty(selectedSpan)) {
      return null;
    }

    const overviewList = [
      getListItem(
        getSpanFieldKey('SPAN_ID'),
        i18n.translate('explore.spanDetailSidebar.title.spanId', {
          defaultMessage: 'Span ID',
        }),
        getSpanValue(selectedSpan, 'SPAN_ID') ? (
          <EuiFlexGroup gutterSize="xs" style={{ marginTop: -4, marginBottom: -4 }}>
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={getSpanValue(selectedSpan, 'SPAN_ID')}>
                {(copy) => (
                  <EuiSmallButtonIcon
                    aria-label={i18n.translate('explore.spanDetailSidebar.ariaLabel.copyButton', {
                      defaultMessage: 'copy-button',
                    })}
                    onClick={copy}
                    iconType="copyClipboard"
                  />
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem>{getSpanValue(selectedSpan, 'SPAN_ID')}</EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          '-'
        )
      ),
      getListItem(
        getSpanFieldKey('PARENT_SPAN_ID'),
        i18n.translate('explore.spanDetailSidebar.title.parentSpanId', {
          defaultMessage: 'Parent span ID',
        }),
        getSpanValue(selectedSpan, 'PARENT_SPAN_ID') ? (
          <EuiFlexGroup gutterSize="xs" style={{ marginTop: -4, marginBottom: -4 }}>
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={selectedSpan.parentSpanId}>
                {(copy) => (
                  <EuiSmallButtonIcon
                    aria-label={i18n.translate('explore.spanDetailSidebar.ariaLabel.copyButton', {
                      defaultMessage: 'copy-button',
                    })}
                    onClick={copy}
                    iconType="copyClipboard"
                  />
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem data-test-subj="parentSpanId">{selectedSpan.parentSpanId}</EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          '-'
        )
      ),
      getListItem(
        getSpanFieldKey('SERVICE'),
        i18n.translate('explore.spanDetailSidebar.title.service', {
          defaultMessage: 'Service',
        }),
        getSpanValue(selectedSpan, 'SERVICE') || '-'
      ),
      getListItem(
        getSpanFieldKey('OPERATION'),
        i18n.translate('explore.spanDetailSidebar.title.operation', {
          defaultMessage: 'Operation',
        }),
        getSpanValue(selectedSpan, 'OPERATION') || '-'
      ),
      getListItem(
        getSpanFieldKey('DURATION'),
        i18n.translate('explore.spanDetailSidebar.title.duration', {
          defaultMessage: 'Duration',
        }),
        `${round(nanoToMilliSec(Math.max(0, selectedSpan.durationInNanos || 0)), 2)} ms`
      ),
      getListItem(
        getSpanFieldKey('START_TIME'),
        i18n.translate('explore.spanDetailSidebar.title.startTime', {
          defaultMessage: 'Start time',
        }),
        selectedSpan.startTime
          ? moment(selectedSpan.startTime).format(TRACE_ANALYTICS_DATE_FORMAT)
          : '-'
      ),
      getListItem(
        getSpanFieldKey('END_TIME'),
        i18n.translate('explore.spanDetailSidebar.title.endTime', {
          defaultMessage: 'End time',
        }),
        selectedSpan.endTime
          ? moment(selectedSpan.endTime).format(TRACE_ANALYTICS_DATE_FORMAT)
          : '-'
      ),
      getListItem(
        getSpanFieldKey('ERRORS'),
        i18n.translate('explore.spanDetailSidebar.title.errors', {
          defaultMessage: 'Errors',
        }),
        selectedSpan['status.code'] === 2 ? (
          <EuiText color="danger" size="s" style={{ fontWeight: 700 }}>
            {i18n.translate('explore.spanDetailSidebar.errors.yes', {
              defaultMessage: 'Yes',
            })}
          </EuiText>
        ) : (
          i18n.translate('explore.spanDetailSidebar.errors.no', {
            defaultMessage: 'No',
          })
        )
      ),
    ];

    const ignoredKeys = new Set([
      'spanId',
      'parentSpanId',
      'serviceName',
      'name',
      'durationInNanos',
      'startTime',
      'endTime',
      'events',
      'traceId',
      'traceGroup',
      'traceGroupFields.endTime',
      'traceGroupFields.statusCode',
      'traceGroupFields.durationInNanos',
    ]);

    const allAttributes = flattenObject(selectedSpan);

    const attributesList = Object.keys(allAttributes)
      .filter((key) => !ignoredKeys.has(key))
      .sort((keyA, keyB) => {
        const isANull = _isEmpty(allAttributes[keyA]);
        const isBNull = _isEmpty(allAttributes[keyB]);
        if ((isANull && isBNull) || (!isANull && !isBNull)) return keyA < keyB ? -1 : 1;
        if (isANull) return 1;
        return -1;
      })
      .map((key) => {
        if (_isEmpty(allAttributes[key])) return getListItem(key, key, '-');
        let value = allAttributes[key];
        if (typeof value === 'object') value = JSON.stringify(value);
        return getListItem(key, key, value);
      });

    const eventsComponent = isEmpty(selectedSpan.events) ? null : (
      <>
        <EuiText size="m">
          <span className="panel-title">
            {i18n.translate('explore.spanDetailSidebar.section.event', {
              defaultMessage: 'Event',
            })}
          </span>
        </EuiText>
        <EuiCodeBlock language="json" paddingSize="s" isCopyable overflowHeight={400}>
          {JSON.stringify(selectedSpan.events, null, 2)}
        </EuiCodeBlock>
        <EuiSpacer size="xs" />
        <EuiHorizontalRule margin="s" />
      </>
    );

    return (
      <>
        <EuiText size="m">
          <span className="panel-title">
            {i18n.translate('explore.spanDetailSidebar.section.overview', {
              defaultMessage: 'Overview',
            })}
          </span>
        </EuiText>
        <>
          <EuiSpacer size="s" />
          {overviewList}
          <EuiSpacer size="xs" />
          <EuiHorizontalRule margin="s" />
          {eventsComponent}
          <EuiText size="m">
            <span className="panel-title">
              {i18n.translate('explore.spanDetailSidebar.section.spanAttributes', {
                defaultMessage: 'Span attributes',
              })}
            </span>
            {attributesList.length === 0 || attributesList.length ? (
              <span className="panel-title-count">{` (${attributesList.length})`}</span>
            ) : null}
          </EuiText>
          <EuiSpacer size="s" />
          {attributesList}
        </>
      </>
    );
  };

  return (
    <EuiPanel
      paddingSize="m"
      hasShadow={false}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Fixed header section */}
      <div style={{ flexShrink: 0 }}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2>
                {i18n.translate('explore.spanDetailSidebar.header.spanDetail', {
                  defaultMessage: 'Span details',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {selectedSpan && !isEmpty(selectedSpan) && (
              <EuiToolTip
                content={i18n.translate('explore.spanDetailSidebar.tooltip.viewAssociatedLogs', {
                  defaultMessage: 'View associated logs using Span Id',
                })}
              >
                <EuiSmallButton
                  onClick={() => {
                    // TODO redirect with corelation to logs
                  }}
                  iconType="discoverApp"
                >
                  {i18n.translate('explore.spanDetailSidebar.button.viewAssociatedLogs', {
                    defaultMessage: 'View associated logs',
                  })}
                </EuiSmallButton>
              </EuiToolTip>
            )}
          </EuiFlexItem>
          {serviceName && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                color="primary"
                onClick={() => setCurrentSpan && setCurrentSpan('')}
                iconType="arrowLeft"
                iconSide="left"
                size="xs"
              >
                {i18n.translate('explore.spanDetailSidebar.button.back', {
                  defaultMessage: 'Back',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
      </div>

      {/* Scrollable content section */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {renderContent()}
      </div>
    </EuiPanel>
  );
};
