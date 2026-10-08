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

const forwardLabel = (target: FlyoutHistoryTarget) =>
  target.kind === 'session'
    ? i18n.translate('agentTraces.flyout.history.forwardToSession', {
        defaultMessage: 'Forward to session',
      })
    : i18n.translate('agentTraces.flyout.history.forwardToTrace', {
        defaultMessage: 'Forward to trace',
      });

/**
 * Back and Forward through the flyouts the user moved between (session <-> trace). Shared
 * by the trace and session flyouts and rendered at the top of both headers, so the title
 * rows line up when one flyout replaces the other. Renders nothing without history.
 */
export const FlyoutHistoryNav: React.FC<{ navigation?: FlyoutNavigation }> = ({ navigation }) => {
  if (!navigation || (!navigation.back && !navigation.forward)) return null;
  const { back, forward, onBack, onForward } = navigation;
  return (
    <EuiFlexGroup
      className="agtFlyoutHistoryNav"
      justifyContent="spaceBetween"
      alignItems="center"
      gutterSize="none"
      responsive={false}
      data-test-subj="agentTracesFlyoutHistoryNav"
    >
      <EuiFlexItem grow={false}>
        {back && (
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
        )}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {forward && (
          <EuiToolTip content={forward.label} position="bottom">
            <EuiButtonEmpty
              size="xs"
              flush="right"
              iconType="arrowRight"
              iconSide="right"
              onClick={onForward}
              data-test-subj="agentTracesFlyoutHistoryForward"
            >
              {forwardLabel(forward)}
            </EuiButtonEmpty>
          </EuiToolTip>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
