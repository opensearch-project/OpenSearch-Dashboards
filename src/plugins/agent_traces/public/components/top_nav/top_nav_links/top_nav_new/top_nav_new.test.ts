/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { newTopNavData, getNewButtonRun } from './top_nav_new';
import { resetAgentTracesStateActionCreator } from '../../../../application/utils/state_management/actions/reset_agent_traces_state';
import { AgentTracesServices } from '../../../../types';

jest.mock(
  '../../../../application/utils/state_management/actions/reset_agent_traces_state',
  () => ({
    resetAgentTracesStateActionCreator: jest.fn(() => 'RESET_ACTION'),
  })
);

describe('newTopNavData', () => {
  it('should have correct properties', () => {
    expect(newTopNavData).toMatchObject({
      tooltip: 'New',
      ariaLabel: 'New Search',
      testId: 'discoverNewButton',
      iconType: 'plusInCircle',
      controlType: 'icon',
    });
  });
});

describe('getNewButtonRun', () => {
  it('should dispatch resetAgentTracesStateActionCreator and navigate to clean URL', () => {
    const dispatch = jest.fn();
    const mockPush = jest.fn();
    const services = ({
      store: { dispatch },
      scopedHistory: { push: mockPush },
    } as unknown) as AgentTracesServices;
    const clearEditors = jest.fn();

    const run = getNewButtonRun(services, clearEditors);
    run({} as HTMLElement);

    expect(resetAgentTracesStateActionCreator).toHaveBeenCalledWith(services, clearEditors);
    expect(dispatch).toHaveBeenCalledWith('RESET_ACTION');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle missing scopedHistory gracefully', () => {
    const dispatch = jest.fn();
    const services = ({
      store: { dispatch },
      scopedHistory: undefined,
    } as unknown) as AgentTracesServices;
    const clearEditors = jest.fn();

    const run = getNewButtonRun(services, clearEditors);

    // Should not throw when scopedHistory is undefined
    expect(() => run({} as HTMLElement)).not.toThrow();

    expect(resetAgentTracesStateActionCreator).toHaveBeenCalledWith(services, clearEditors);
    expect(dispatch).toHaveBeenCalledWith('RESET_ACTION');
  });
});
