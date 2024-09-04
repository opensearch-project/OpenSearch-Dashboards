/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import './_recent_query.scss';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiPopoverTitle } from '@elastic/eui';

import React, { useState } from 'react';

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
  elapsedMs?: number;
}

export function QueryResult(props: { queryStatus: QueryStatus }) {
  const [isPopoverOpen, setPopover] = useState(false);
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  if (props.queryStatus.status === ResultStatus.READY) {
    return (
      <EuiButtonEmpty iconSide="left" iconType={'checkInCircleEmpty'} size="xs" onClick={() => {}}>
        <EuiText size="xs" color="subdued">
          {props.queryStatus.elapsedMs
            ? `Completed in ${props.queryStatus.elapsedMs} ms`
            : 'Completed'}
        </EuiText>
      </EuiButtonEmpty>
    );
  }

  if (!props.queryStatus.body || !props.queryStatus.body.error) {
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
          <strong>
            {i18n.translate('data.query.languageService.queryResults.reasons', {
              defaultMessage: `Reasons:`,
            })}
          </strong>
          {props.queryStatus.body.error.reason}
        </EuiText>
        <EuiText size="s">
          <p>
            <strong>
              {i18n.translate('data.query.languageService.queryResults.details', {
                defaultMessage: `Details:`,
              })}
            </strong>{' '}
            {props.queryStatus.body.error.details}
          </p>
        </EuiText>
      </div>
    </EuiPopover>
  );
}
