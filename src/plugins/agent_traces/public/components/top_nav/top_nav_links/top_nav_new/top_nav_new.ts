/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AgentTracesServices } from '../../../../types';
import { resetAgentTracesStateActionCreator } from '../../../../application/utils/state_management/actions/reset_agent_traces_state';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { useClearEditors } from '../../../../application/hooks';

// One label for both the tooltip and the aria-label, so the icon strip reads as a set of
// search actions rather than four bare verbs.
const newSearchLabel = i18n.translate('agentTraces.topNav.newAriaLabel', {
  defaultMessage: 'New search',
});

export const newTopNavData: TopNavMenuIconUIData = {
  tooltip: newSearchLabel,
  ariaLabel: newSearchLabel,
  testId: 'discoverNewButton',
  iconType: 'plusInCircle',
  controlType: 'icon',
};

export const getNewButtonRun =
  (
    services: AgentTracesServices,
    clearEditors: ReturnType<typeof useClearEditors>
  ): TopNavMenuIconRun =>
  () => {
    services.store.dispatch(resetAgentTracesStateActionCreator(services, clearEditors));

    if (services.scopedHistory) {
      services.scopedHistory.push('/');
    }
  };
