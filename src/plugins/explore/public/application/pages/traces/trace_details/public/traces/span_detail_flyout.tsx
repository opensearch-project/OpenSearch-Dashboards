/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiLoadingContent,
  EuiSmallButton,
  EuiSmallButtonIcon,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { TracePPLService as PPLService } from '../../server/ppl_request_trace';
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

export function SpanDetailFlyout(props: {
  spanId: string;
  isFlyoutVisible: boolean;
  closeFlyout: () => void;
  addSpanFilter: (field: string, value: any) => void;
  dataSourceMDSId: string;
  dataSourceMDSLabel: string | undefined;
  serviceName?: string;
  setCurrentSelectedService?: React.Dispatch<React.SetStateAction<string>> | undefined;
  startTime?: string;
  endTime?: string;
  setCurrentSpan?: React.Dispatch<React.SetStateAction<string>>;
  traceId?: string;
  pplService?: PPLService;
  indexPattern?: string;
  // Required prop for all spans data
  allSpans: any[];
}) {
  const [span, setSpan] = useState<any>({});
  const [isSpanDataLoading, setIsSpanDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Find the span in the existing data
    if (props.spanId && props.allSpans.length > 0) {
      setIsSpanDataLoading(true);
      setError(null);

      try {
        // Find the span in the existing data
        const spanData = props.allSpans.find((s) => s.spanId === props.spanId);

        if (spanData) {
          setSpan(spanData);
        } else {
          // eslint-disable-next-line no-console
          console.warn(`Span with ID ${props.spanId} not found in provided spans data`);
          setError(`Span with ID ${props.spanId} not found`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error finding span in existing data:', err);
        setError('Error processing span data');
      } finally {
        setIsSpanDataLoading(false);
      }
    }
  }, [props.spanId, props.traceId, props.pplService, props.dataSourceMDSId, props.allSpans]);

  useEffect(() => {
    if (props.isFlyoutVisible && props.spanId && props.allSpans.length > 0) {
      // Update the span data when allSpans changes
      const spanData = props.allSpans.find((s) => s.spanId === props.spanId);
      if (spanData) {
        setSpan(spanData);
        setError(null);
      }
    }
  }, [props.allSpans, props.isFlyoutVisible, props.spanId]);

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
            ? () => props.addSpanFilter(fieldKey, get(flattenObject(span), fieldKey))
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
    if (isSpanDataLoading) {
      return (
        <div>
          <EuiLoadingContent lines={5} />
        </div>
      );
    }

    if (error) {
      return (
        <EuiText color="danger">
          <p>
            {i18n.translate('explore.spanDetailFlyout.error.loadingSpanData', {
              defaultMessage: 'Error loading span data: {errorMessage}',
              values: { errorMessage: error },
            })}
          </p>
        </EuiText>
      );
    }

    if (!span || isEmpty(span)) {
      return (
        <EuiText>
          <p>
            {i18n.translate('explore.spanDetailFlyout.error.noSpanDataAvailable', {
              defaultMessage: 'No span data available',
            })}
          </p>
        </EuiText>
      );
    }

    const overviewList = [
      getListItem(
        getSpanFieldKey('SPAN_ID'),
        i18n.translate('explore.spanDetailFlyout.title.spanId', {
          defaultMessage: 'Span ID',
        }),
        getSpanValue(span, 'SPAN_ID') ? (
          <EuiFlexGroup gutterSize="xs" style={{ marginTop: -4, marginBottom: -4 }}>
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={getSpanValue(span, 'SPAN_ID')}>
                {(copy) => (
                  <EuiSmallButtonIcon
                    aria-label={i18n.translate('explore.spanDetailFlyout.ariaLabel.copyButton', {
                      defaultMessage: 'copy-button',
                    })}
                    onClick={copy}
                    iconType="copyClipboard"
                  />
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem>{getSpanValue(span, 'SPAN_ID')}</EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          '-'
        )
      ),
      getListItem(
        getSpanFieldKey('PARENT_SPAN_ID'),
        i18n.translate('explore.spanDetailFlyout.title.parentSpanId', {
          defaultMessage: 'Parent span ID',
        }),
        getSpanValue(span, 'PARENT_SPAN_ID') ? (
          <EuiFlexGroup gutterSize="xs" style={{ marginTop: -4, marginBottom: -4 }}>
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={span.parentSpanId}>
                {(copy) => (
                  <EuiSmallButtonIcon
                    aria-label={i18n.translate('explore.spanDetailFlyout.ariaLabel.copyButton', {
                      defaultMessage: 'copy-button',
                    })}
                    onClick={copy}
                    iconType="copyClipboard"
                  />
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem data-test-subj="parentSpanId">{span.parentSpanId}</EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          '-'
        )
      ),
      getListItem(
        getSpanFieldKey('SERVICE'),
        i18n.translate('explore.spanDetailFlyout.title.service', {
          defaultMessage: 'Service',
        }),
        getSpanValue(span, 'SERVICE') || '-'
      ),
      getListItem(
        getSpanFieldKey('OPERATION'),
        i18n.translate('explore.spanDetailFlyout.title.operation', {
          defaultMessage: 'Operation',
        }),
        getSpanValue(span, 'OPERATION') || '-'
      ),
      getListItem(
        getSpanFieldKey('DURATION'),
        i18n.translate('explore.spanDetailFlyout.title.duration', {
          defaultMessage: 'Duration',
        }),
        `${round(nanoToMilliSec(Math.max(0, span.durationInNanos || 0)), 2)} ms`
      ),
      getListItem(
        getSpanFieldKey('START_TIME'),
        i18n.translate('explore.spanDetailFlyout.title.startTime', {
          defaultMessage: 'Start time',
        }),
        span.startTime ? moment(span.startTime).format(TRACE_ANALYTICS_DATE_FORMAT) : '-'
      ),
      getListItem(
        getSpanFieldKey('END_TIME'),
        i18n.translate('explore.spanDetailFlyout.title.endTime', {
          defaultMessage: 'End time',
        }),
        span.endTime ? moment(span.endTime).format(TRACE_ANALYTICS_DATE_FORMAT) : '-'
      ),
      getListItem(
        getSpanFieldKey('ERRORS'),
        i18n.translate('explore.spanDetailFlyout.title.errors', {
          defaultMessage: 'Errors',
        }),
        span['status.code'] === 2 ? (
          <EuiText color="danger" size="s" style={{ fontWeight: 700 }}>
            {i18n.translate('explore.spanDetailFlyout.errors.yes', {
              defaultMessage: 'Yes',
            })}
          </EuiText>
        ) : (
          i18n.translate('explore.spanDetailFlyout.errors.no', {
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

    const allAttributes = flattenObject(span);

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

    const eventsComponent = isEmpty(span.events) ? null : (
      <>
        <EuiText size="m">
          <span className="panel-title">
            {i18n.translate('explore.spanDetailFlyout.section.event', {
              defaultMessage: 'Event',
            })}
          </span>
        </EuiText>
        <EuiCodeBlock language="json" paddingSize="s" isCopyable overflowHeight={400}>
          {JSON.stringify(span.events, null, 2)}
        </EuiCodeBlock>
        <EuiSpacer size="xs" />
        <EuiHorizontalRule margin="s" />
      </>
    );

    return (
      <>
        <EuiText size="m">
          <span className="panel-title">
            {i18n.translate('explore.spanDetailFlyout.section.overview', {
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
              {i18n.translate('explore.spanDetailFlyout.section.spanAttributes', {
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
    <>
      <EuiFlyout
        data-test-subj="spanDetailFlyout"
        onClose={() => {
          props.closeFlyout();
        }}
        size="s"
      >
        <EuiFlyoutHeader hasBorder>
          <EuiSpacer size="s" />
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem>
              <EuiText size="s">
                <h2>
                  {i18n.translate('explore.spanDetailFlyout.header.spanDetail', {
                    defaultMessage: 'Span detail',
                  })}
                </h2>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {!isSpanDataLoading && !isEmpty(span) && (
                <EuiToolTip
                  content={i18n.translate('explore.spanDetailFlyout.tooltip.viewAssociatedLogs', {
                    defaultMessage: 'View associated logs using Span Id',
                  })}
                >
                  <EuiSmallButton
                    onClick={() => {
                      // const spanId = getSpanValue(span, 'SPAN_ID');
                      // redirectSpansToLogs({
                      //   fromTime: span.startTime,
                      //   toTime: span.endTime,
                      //   spanId,
                      //   dataSourceMDSId: [
                      //     { id: props.dataSourceMDSId, label: props.dataSourceMDSLabel! },
                      //   ],
                      // });
                    }}
                    iconType="discoverApp"
                  >
                    {i18n.translate('explore.spanDetailFlyout.button.viewAssociatedLogs', {
                      defaultMessage: 'View associated logs',
                    })}
                  </EuiSmallButton>
                </EuiToolTip>
              )}
            </EuiFlexItem>
            {props.serviceName && (
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  style={{ position: 'absolute', left: '0px', top: '8px', zIndex: 3 }}
                  color="primary"
                  onClick={() => props.setCurrentSpan && props.setCurrentSpan('')}
                  iconType="arrowLeft"
                  iconSide="left"
                  size="xs"
                >
                  {i18n.translate('explore.spanDetailFlyout.button.back', {
                    defaultMessage: 'Back',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>{renderContent()}</EuiFlyoutBody>
      </EuiFlyout>
    </>
  );
}
