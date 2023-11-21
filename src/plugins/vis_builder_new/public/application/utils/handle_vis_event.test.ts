/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionRendererEvent } from '../../../../expressions/public';
import { VIS_EVENT_TO_TRIGGER } from '../../../../visualizations/public';
import { handleVisEvent } from './handle_vis_event';
import { uiActionsPluginMock } from '../../../../ui_actions/public/mocks';
import { Action, ActionType, createAction } from '../../../../ui_actions/public';

const executeFn = jest.fn();

function createTestAction<C extends object>(
  type: string,
  checkCompatibility: (context: C) => boolean,
  autoExecutable = true
): Action<object> {
  return createAction({
    type: type as ActionType,
    id: type,
    isCompatible: (context: C) => Promise.resolve(checkCompatibility(context)),
    execute: (context) => {
      return executeFn(context);
    },
    shouldAutoExecute: () => Promise.resolve(autoExecutable),
  });
}

let uiActions: ReturnType<typeof uiActionsPluginMock.createPlugin>;

describe('handleVisEvent', () => {
  beforeEach(() => {
    uiActions = uiActionsPluginMock.createPlugin();

    executeFn.mockClear();
    jest.useFakeTimers();
  });

  test('should trigger the correct event', async () => {
    const event: ExpressionRendererEvent = {
      name: 'filter',
      data: {},
    };
    const action = createTestAction('test1', () => true);
    const timeFieldName = 'test-timefeild-name';
    uiActions.setup.addTriggerAction(VIS_EVENT_TO_TRIGGER.filter, action);

    await handleVisEvent(event, uiActions.doStart(), timeFieldName);

    jest.runAllTimers();

    expect(executeFn).toBeCalledTimes(1);
    expect(executeFn).toBeCalledWith(
      expect.objectContaining({
        data: { timeFieldName },
      })
    );
  });

  test('should trigger the default trigger when not found', async () => {
    const event: ExpressionRendererEvent = {
      name: 'test',
      data: {},
    };
    const action = createTestAction('test2', () => true);
    const timeFieldName = 'test-timefeild-name';
    uiActions.setup.addTriggerAction(VIS_EVENT_TO_TRIGGER.filter, action);

    await handleVisEvent(event, uiActions.doStart(), timeFieldName);

    jest.runAllTimers();

    expect(executeFn).toBeCalledTimes(1);
    expect(executeFn).toBeCalledWith(
      expect.objectContaining({
        data: { timeFieldName },
      })
    );
  });

  test('should have the correct context for `applyfilter`', async () => {
    const event: ExpressionRendererEvent = {
      name: 'applyFilter',
      data: {},
    };
    const action = createTestAction('test3', () => true);
    const timeFieldName = 'test-timefeild-name';
    uiActions.setup.addTriggerAction(VIS_EVENT_TO_TRIGGER.applyFilter, action);

    await handleVisEvent(event, uiActions.doStart(), timeFieldName);

    jest.runAllTimers();

    expect(executeFn).toBeCalledTimes(1);
    expect(executeFn).toBeCalledWith(
      expect.objectContaining({
        timeFieldName,
      })
    );
  });
});
