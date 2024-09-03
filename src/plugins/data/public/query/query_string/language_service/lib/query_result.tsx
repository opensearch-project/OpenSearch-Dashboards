/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_recent_query.scss';

import { BehaviorSubject } from 'rxjs';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiPopoverTitle } from '@elastic/eui';

import React, { useState, useEffect } from 'react';

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
      reason?: string;
      details: string;
    };
    statusCode?: number;
  };
  time?: number;
}

export function QueryResult(props: { queryStatus$: BehaviorSubject<QueryStatus> }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const [queryStatus, setQueryStatus] = useState<QueryStatus>({ status: ResultStatus.READY });
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  useEffect(() => {
    const subscription = props.queryStatus$.subscribe((status) => {
      setQueryStatus(status);
    });
    return () => subscription.unsubscribe();
  }, [props.queryStatus$]);

  if (queryStatus.status === ResultStatus.READY) {
    return (
      <EuiButtonEmpty iconSide="left" iconType={'checkInCircleEmpty'} size="xs" onClick={() => {}}>
        <EuiText size="xs" color="subdued">
          {queryStatus.time ? `Completed in ${queryStatus.time} ms` : 'Completed'}
        </EuiText>
      </EuiButtonEmpty>
    );
  }

  if (!queryStatus.body || !queryStatus.body.error) {
    return null;
  }

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty iconSide="left" iconType={'alert'} size="xs" onClick={onButtonClick}>
          <EuiText size="xs" color="subdued">
            {'Error'}
          </EuiText>
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      panelPaddingSize="s"
      anchorPosition={'downRight'}
    >
      <EuiPopoverTitle>ERRORS</EuiPopoverTitle>
      <div style={{ width: '250px' }}>
        <EuiText size="s">
          <strong>Reasons: </strong>
          {queryStatus.body.error.reason}
        </EuiText>
        <EuiText size="s">
          <p>
            <strong>Details:</strong> {queryStatus.body.error.details}
          </p>
        </EuiText>
      </div>
    </EuiPopover>
  );
}
