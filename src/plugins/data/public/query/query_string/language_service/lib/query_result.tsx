/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import './_recent_query.scss';
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiText,
  EuiPopoverTitle,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import { useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../../../types';

const DISCOVER_APP_ID = 'data-explorer';

const ASK_AI_ERROR_MESSAGE =
  'My query on this page failed to run with the following error: "{error}". Please review my query, fix it, and run the corrected query on the page so I can see the results.';

function extractErrorForAssistant(errorBody: any): string {
  if (errorBody?.shortMessage) {
    return errorBody.shortMessage;
  }
  const message = errorBody?.message;
  const inner = errorBody?.attributes?.error || message?.error;
  return (
    (typeof inner === 'string'
      ? inner
      : inner?.root_cause?.[0]?.reason || inner?.details || inner?.reason) ||
    (typeof message === 'string' ? message : undefined) ||
    errorBody?.error ||
    'Query execution failed'
  );
}

export enum ResultStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading', // initial data load
  READY = 'ready', // results came back
  NO_RESULTS = 'none', // no results came back
  ERROR = 'error', // error occurred
}

export interface QueryStatus {
  status: ResultStatus;
  body?: {
    error?: {
      error?: string;
      message?: {
        error?:
          | string
          | {
              reason?: string;
              details: string;
              type?: string;
            };
        status?: number;
      };
      statusCode?: number;
    };
  };
  elapsedMs?: number;
  startTime?: number;
  resultsCount?: number;
}

// This is the time in milliseconds that the query will wait before showing the loading spinner
const BUFFER_TIME = 3000;

export function QueryResult(props: { queryStatus: QueryStatus }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  useEffect(() => {
    const updateElapsedTime = () => {
      const currentTime = Date.now();
      if (!props.queryStatus.startTime) {
        return;
      }
      const elapsed = currentTime - props.queryStatus.startTime;
      setElapsedTime(elapsed);
    };

    const interval = setInterval(updateElapsedTime, 1000);

    return () => {
      clearInterval(interval as unknown as NodeJS.Timeout);
      setElapsedTime(0);
    };
  }, [props.queryStatus.startTime]);

  const displayErrorMessage = useMemo(() => {
    const error = props.queryStatus.body?.error;
    const reason =
      typeof error?.message?.error === 'object' ? error.message.error.reason : undefined;

    if (reason) {
      return reason;
    }

    const message = error?.message;

    if (message == null) {
      if (typeof error === 'string') {
        return error;
      }

      if (typeof error === 'object') {
        return JSON.stringify(error);
      }

      return `Unknown Error: ${String(error)}`;
    }

    // For async search strategy, expecting message.error to be string
    if (typeof message.error === 'string') {
      return message.error;
    }

    // For normal search strategy, expecting message.error to be object
    if (message.error?.details) {
      return message.error.details;
    }

    // For normal search strategy, expecting message.error to be object
    if (typeof message === 'string') {
      return message;
    }

    if (typeof message === 'object') {
      return JSON.stringify(message);
    }

    return `Unknown Error: ${String(message)}`;
  }, [props.queryStatus.body?.error]);

  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const currentAppId = useObservable(
    services?.application?.currentAppId$ ?? of(undefined),
    undefined
  );
  const showAskAiForHelp =
    currentAppId === DISCOVER_APP_ID &&
    (services?.chat?.isAvailable?.() ?? false) &&
    (props.queryStatus.resultsCount ?? 0) > 0;

  const onAskAiForHelp = () => {
    const error = extractErrorForAssistant(props.queryStatus.body?.error);
    const message = ASK_AI_ERROR_MESSAGE.replace('{error}', error);
    services?.chat?.sendMessageWithWindow?.(message, []).catch(() => {});
  };

  if (props.queryStatus.status === ResultStatus.LOADING) {
    const time = Math.floor(elapsedTime / 1000);
    const loadingText =
      elapsedTime > BUFFER_TIME
        ? i18n.translate('data.query.languageService.queryResults.loadTime', {
            defaultMessage: 'Loading {time} s',
            values: { time },
          })
        : '';
    return (
      <EuiButtonEmpty
        color="text"
        size="xs"
        onClick={() => {}}
        isLoading
        data-test-subj="queryResultLoading"
        className="editor__footerItem"
      >
        <EuiText size="xs" color="subdued" data-test-subj="queryResultLoadingMsg">
          {loadingText}
        </EuiText>
      </EuiButtonEmpty>
    );
  }

  if (props.queryStatus.status === ResultStatus.READY) {
    let message;
    if (!props.queryStatus.elapsedMs) {
      message = i18n.translate('data.query.languageService.queryResults.completeNoTime', {
        defaultMessage: 'Completed',
      });
    } else if (props.queryStatus.elapsedMs < 1000) {
      message = i18n.translate(
        'data.query.languageService.queryResults.completeTimeInMilliseconds',
        {
          defaultMessage: 'Completed in {timeMS} ms',
          values: { timeMS: props.queryStatus.elapsedMs },
        }
      );
    } else {
      message = i18n.translate('data.query.languageService.queryResults.completeTimeInSeconds', {
        defaultMessage: 'Completed in {time} s',
        values: { time: (props.queryStatus.elapsedMs / 1000).toFixed(1) },
      });
    }

    return (
      <EuiButtonEmpty
        iconSide="left"
        iconType={'checkInCircleEmpty'}
        iconGap="s"
        size="xs"
        onClick={() => {}}
      >
        <EuiText size="xs" color="subdued" data-test-subj="queryResultCompleteMsg">
          {message}
        </EuiText>
      </EuiButtonEmpty>
    );
  }

  if (props.queryStatus.status === ResultStatus.UNINITIALIZED || !props.queryStatus.body?.error) {
    return null;
  }

  return (
    <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={
            <EuiButtonEmpty
              iconSide="left"
              iconType={'alert'}
              size="xs"
              onClick={onButtonClick}
              data-test-subj="queryResultErrorBtn"
              className="editor__footerItem"
              color="danger"
            >
              <EuiText
                size="xs"
                color="danger"
                className="editor__footerItem"
                data-test-subj="editorFooterItem"
              >
                {i18n.translate('data.query.languageService.queryResults.error', {
                  defaultMessage: `Error`,
                })}
              </EuiText>
            </EuiButtonEmpty>
          }
          isOpen={isPopoverOpen}
          closePopover={() => setPopover(false)}
          panelPaddingSize="s"
          anchorPosition={'downRight'}
          data-test-subj="queryResultError"
        >
          <EuiPopoverTitle>ERRORS</EuiPopoverTitle>
          <div
            style={{ width: '250px', maxHeight: '250px', overflowY: 'auto' }}
            className="eui-textBreakWord"
            data-test-subj="textBreakWord"
          >
            <EuiText size="s">
              <p>
                <strong>
                  {i18n.translate('data.query.languageService.queryResults.message', {
                    defaultMessage: `Message:`,
                  })}
                </strong>{' '}
                {displayErrorMessage}
              </p>
            </EuiText>
          </div>
        </EuiPopover>
      </EuiFlexItem>
      {showAskAiForHelp && (
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            iconSide="left"
            iconType={'generate'}
            size="xs"
            flush="left"
            style={{ marginLeft: 8 }}
            onClick={onAskAiForHelp}
            data-test-subj="discoverQueryErrorAskAiForHelp"
            className="editor__footerItem"
          >
            <EuiText size="xs" className="editor__footerItem" data-test-subj="editorFooterItem">
              {i18n.translate('data.query.languageService.queryResults.askAI', {
                defaultMessage: `Ask AI for help`,
              })}
            </EuiText>
          </EuiButtonEmpty>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}
