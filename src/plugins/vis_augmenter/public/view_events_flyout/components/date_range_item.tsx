/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import moment from 'moment';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  prettyDuration,
  EuiButton,
} from '@elastic/eui';
import { TimeRange } from '../../../../data/common';
import { DATE_RANGE_FORMAT } from './view_events_flyout';

interface Props {
  timeRange: TimeRange;
  reload: () => void;
}

export function DateRangeItem(props: Props) {
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(
    moment(Date.now()).format(DATE_RANGE_FORMAT)
  );

  const durationText = prettyDuration(
    props.timeRange.from,
    props.timeRange.to,
    [],
    DATE_RANGE_FORMAT
  );

  return (
    <EuiFlexGroup direction="row" gutterSize="m" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiIcon type="calendar" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText data-test-subj="durationText">{durationText}</EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType={'refresh'}
          isDisabled={false}
          onClick={() => {
            props.reload();
            setLastUpdatedTime(moment(Date.now()).format(DATE_RANGE_FORMAT));
          }}
          data-test-subj="refreshButton"
        >
          Refresh
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false} data-test-subj="refreshDescriptionText">
        <EuiText size="s" color="subdued" style={{ whiteSpace: 'pre-line' }}>
          {`This view is not updated to load the latest events automatically.
         Last updated: ${lastUpdatedTime}`}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
