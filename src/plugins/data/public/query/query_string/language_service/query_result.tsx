/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_recent_query.scss';

import { EuiButtonEmpty, EuiPopover, EuiText, EuiContextMenu, EuiPopoverTitle } from '@elastic/eui';

import React, { useState } from 'react';
import { SearchData } from '../../../../../discover/public';

export function QueryResult(props: { queryResult: SearchData }) {
  console.log('QueryResult', props.queryResult);
  const [isPopoverOpen, setPopover] = useState(false);
  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const status = props.queryResult.status;

  if (status === 'ready') {
    return (
      <EuiButtonEmpty iconSide="left" iconType={'checkInCircleEmpty'} size="xs" onClick={() => {}}>
        <EuiText size="xs" color="subdued">
          {'Complete in ' + props.queryResult.queryTime + ' ms'}
        </EuiText>
      </EuiButtonEmpty>
    );
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
      panelPaddingSize="none"
      anchorPosition={'downRight'}
    >
      <EuiPopoverTitle>Error message</EuiPopoverTitle>
      <div style={{ width: '250px' }}>
        <EuiText size="s">
          {props.queryResult.errorMsg && props.queryResult.errorMsg.message}
        </EuiText>
      </div>
    </EuiPopover>
  );
}
