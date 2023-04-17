/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionRendererEvent } from '../../../../expressions/public';
import { VIS_EVENT_TO_TRIGGER } from '../../../../visualizations/public';
import { UiActionsStart } from '../../../../ui_actions/public';

export const handleVisEvent = async (
  event: ExpressionRendererEvent,
  uiActions: UiActionsStart,
  timeFieldName?: string
) => {
  const triggerId = VIS_EVENT_TO_TRIGGER[event.name] ?? VIS_EVENT_TO_TRIGGER.filter;
  const isApplyFilter = triggerId === VIS_EVENT_TO_TRIGGER.applyFilter;
  const dataContext = {
    timeFieldName,
    ...event.data,
  };
  const context = isApplyFilter ? dataContext : { data: dataContext };

  await uiActions.getTrigger(triggerId).exec(context);
};
