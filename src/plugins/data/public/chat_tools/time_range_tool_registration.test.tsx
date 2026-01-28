/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TimeRangeToolRegistration } from './time_range_tool_registration';
import { TimefilterContract } from '../query/timefilter';

describe('TimeRangeToolRegistration', () => {
  let mockTimefilter: jest.Mocked<TimefilterContract>;
  let mockUseAssistantAction: jest.Mock;

  beforeEach(() => {
    mockTimefilter = ({
      setTime: jest.fn(),
    } as unknown) as jest.Mocked<TimefilterContract>;
    mockUseAssistantAction = jest.fn();
  });

  it('registers tool with useAssistantAction', () => {
    render(
      <TimeRangeToolRegistration
        timefilter={mockTimefilter}
        useAssistantAction={mockUseAssistantAction}
      />
    );

    expect(mockUseAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'update_time_range',
        description: expect.stringContaining('ONLY use when user explicitly'),
        parameters: expect.objectContaining({
          type: 'object',
          required: ['from', 'to'],
        }),
        handler: expect.any(Function),
      })
    );
  });

  it('does not call useAssistantAction when not provided', () => {
    render(<TimeRangeToolRegistration timefilter={mockTimefilter} />);
    // Should not throw error
  });

  it('handler updates timefilter on success', async () => {
    render(
      <TimeRangeToolRegistration
        timefilter={mockTimefilter}
        useAssistantAction={mockUseAssistantAction}
      />
    );

    const config = mockUseAssistantAction.mock.calls[0][0];
    const result = await config.handler({ from: 'now-1h', to: 'now' });

    expect(mockTimefilter.setTime).toHaveBeenCalledWith({ from: 'now-1h', to: 'now' });
    expect(result.success).toBe(true);
    expect(result.message).toContain('now-1h');
  });

  it('handler returns error on failure', async () => {
    mockTimefilter.setTime.mockImplementation(() => {
      throw new Error('Test error');
    });

    render(
      <TimeRangeToolRegistration
        timefilter={mockTimefilter}
        useAssistantAction={mockUseAssistantAction}
      />
    );

    const config = mockUseAssistantAction.mock.calls[0][0];
    const result = await config.handler({ from: 'invalid', to: 'invalid' });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed');
  });
});
