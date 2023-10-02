/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { get } from 'lodash';
import { EuiFlexItem, EuiNotificationBadge, EuiButtonIcon, EuiPopover } from '@elastic/eui';
import './styles.scss';
import { VisLayer, VisLayerTypes } from '../../';

interface Props {
  visLayer: VisLayer;
}

/**
 * Returns a badge with the event count for this particular VisLayer (only PointInTimeEventVisLayers
 * are currently supported), or an error icon which can be clicked to view the error message.
 */
export function EventVisItemIcon(props: Props) {
  const [isErrorPopoverOpen, setIsErrorPopoverOpen] = useState(false);
  const onButtonClick = () => setIsErrorPopoverOpen((isOpen) => !isOpen);
  const closeErrorPopover = () => setIsErrorPopoverOpen(false);

  const errorMsg = get(props, 'visLayer.error.message', undefined) as string | undefined;
  const isError = errorMsg !== undefined;
  const showEventCount = props.visLayer.type === VisLayerTypes.PointInTimeEvents && !isError;

  const dangerButton = (
    <EuiButtonIcon
      data-test-subj="dangerButton"
      aria-label="Open error details"
      className="error-icon-padding"
      iconType={'alert'}
      color="danger"
      size="xs"
      display="empty"
      onClick={onButtonClick}
    />
  );

  return (
    <>
      {showEventCount ? (
        <EuiFlexItem grow={false} data-test-subj="eventCount">
          <EuiNotificationBadge color="subdued">
            {get(props.visLayer, 'events.length', 0)}
          </EuiNotificationBadge>
        </EuiFlexItem>
      ) : isError ? (
        <EuiFlexItem grow={false} data-test-subj="errorButton">
          <EuiPopover
            button={dangerButton}
            isOpen={isErrorPopoverOpen}
            closePopover={closeErrorPopover}
          >
            <div>{errorMsg}</div>
          </EuiPopover>
        </EuiFlexItem>
      ) : null}
    </>
  );
}
