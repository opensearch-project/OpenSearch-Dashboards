/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { ViewEventsFlyout } from '../components';
import { VIEW_EVENTS_FLYOUT_STATE, setFlyoutState } from '../flyout_state';
import { getCore } from '../../services';

interface Props {
  savedObjectId: string;
}

export async function openViewEventsFlyout(props: Props) {
  setFlyoutState(VIEW_EVENTS_FLYOUT_STATE.OPEN);
  const flyoutSession = getCore().overlays.openFlyout(
    toMountPoint(
      <ViewEventsFlyout
        onClose={() => {
          if (flyoutSession) {
            flyoutSession.close();
            setFlyoutState(VIEW_EVENTS_FLYOUT_STATE.CLOSED);
          }
        }}
        savedObjectId={props.savedObjectId}
      />
    ),
    {
      'data-test-subj': 'viewEventsFlyout',
      ownFocus: true,
    }
  );
}
