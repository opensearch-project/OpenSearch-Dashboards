/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { FlyoutHistoryTarget, FlyoutNavigation } from './trace_flyout_state';
import './flyout_history_nav.scss';

const backLabel = (target: FlyoutHistoryTarget) =>
  target.kind === 'session'
    ? i18n.translate('agentTraces.flyout.history.backToSession', {
        defaultMessage: 'Back to session',
      })
    : i18n.translate('agentTraces.flyout.history.backToTrace', {
        defaultMessage: 'Back to trace',
      });

/**
 * Back to the flyout the user came from (session <-> trace). Shared by the trace and session
 * flyouts and rendered at the top of both headers, so the title rows line up when one flyout
 * replaces the other. Renders nothing without history.
 */
export const FlyoutHistoryNav: React.FC<{ navigation?: FlyoutNavigation }> = ({ navigation }) => {
  if (!navigation?.back) return null;
  const { back, onBack } = navigation;
  return (
    <EuiFlexGroup
      className="agtFlyoutHistoryNav"
      alignItems="center"
      gutterSize="none"
      responsive={false}
      data-test-subj="agentTracesFlyoutHistoryNav"
    >
      <EuiFlexItem grow={false}>
        <EuiToolTip content={back.label} position="bottom">
          <EuiButtonEmpty
            size="xs"
            flush="left"
            iconType="arrowLeft"
            onClick={onBack}
            data-test-subj="agentTracesFlyoutHistoryBack"
          >
            {backLabel(back)}
          </EuiButtonEmpty>
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
