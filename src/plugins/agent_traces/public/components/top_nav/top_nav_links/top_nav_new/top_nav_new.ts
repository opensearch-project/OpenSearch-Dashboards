/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AgentTracesServices } from '../../../../types';
import { resetAgentTracesStateActionCreator } from '../../../../application/utils/state_management/actions/reset_agent_traces_state';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { useClearEditors } from '../../../../application/hooks';

export const newTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('agentTraces.topNav.newTitle', {
    defaultMessage: 'New',
  }),
  ariaLabel: i18n.translate('agentTraces.topNav.newAriaLabel', {
    defaultMessage: `New Search`,
  }),
  testId: 'discoverNewButton',
  iconType: 'plusInCircle',
  controlType: 'icon',
};

export const getNewButtonRun = (
  services: AgentTracesServices,
  clearEditors: ReturnType<typeof useClearEditors>
): TopNavMenuIconRun => () => {
  services.store.dispatch(resetAgentTracesStateActionCreator(services, clearEditors));

  if (services.scopedHistory) {
    services.scopedHistory.push('/');
  }
};
