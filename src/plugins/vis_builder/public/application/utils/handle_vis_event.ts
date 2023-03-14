/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { ExpressionRendererEvent } from '../../../../expressions/public';
import { VIS_EVENT_TO_TRIGGER } from '../../../../visualizations/public';
import { UiActionsStart } from '../../../../ui_actions/public';

export const handleVisEvent = async (
  event: ExpressionRendererEvent,
  uiActions: UiActionsStart,
  timeFieldName?: string
) => {
  const triggerId = get(VIS_EVENT_TO_TRIGGER, event.name, VIS_EVENT_TO_TRIGGER.filter);
  let context;

  if (triggerId === VIS_EVENT_TO_TRIGGER.applyFilter) {
    context = {
      timeFieldName,
      ...event.data,
    };
  } else {
    context = {
      data: {
        timeFieldName,
        ...event.data,
      },
    };
  }

  await uiActions.getTrigger(triggerId).exec(context);
};
