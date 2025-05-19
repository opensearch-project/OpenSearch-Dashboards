/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import './_recent_query.scss';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiPopoverTitle } from '@elastic/eui';

import React, { useEffect, useMemo, useState } from 'react';

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
      clearInterval((interval as unknown) as NodeJS.Timeout);
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
  );
}
