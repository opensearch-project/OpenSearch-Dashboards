/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import './_recent_query.scss';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiPopoverTitle } from '@elastic/eui';

import React, { useEffect, useState } from 'react';

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
      statusCode?: number;
      message?: string;
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
      clearInterval(interval);
      setElapsedTime(0);
    };
  }, [props.queryStatus.startTime]);

  if (elapsedTime > BUFFER_TIME && props.queryStatus.status === ResultStatus.LOADING) {
    const time = Math.floor(elapsedTime / 1000);
    return (
      <EuiButtonEmpty
        color="text"
        size="xs"
        onClick={() => {}}
        isLoading
        data-test-subj="queryResultLoading"
        className="editor__footerItem"
      >
        {i18n.translate('data.query.languageService.queryResults.loadTime', {
          defaultMessage: 'Loading {time} s',
          values: { time },
        })}
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
            {props.queryStatus.body.error.message}
          </p>
        </EuiText>
      </div>
    </EuiPopover>
  );
}
