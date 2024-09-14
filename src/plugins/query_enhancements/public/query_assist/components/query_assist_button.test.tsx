/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { QueryAssistButton } from './query_assist_button';
import { useQueryAssist } from '../hooks';

jest.mock('../hooks', () => ({
  useQueryAssist: jest.fn(),
}));

describe('query assist button', () => {
  const setIsCollapsed = jest.fn();
  const updateIsQueryAssistCollapsed = jest.fn();

  const props: ComponentProps<typeof QueryAssistButton> = {
    dependencies: {
      isCollapsed: false,
      setIsCollapsed,
    },
  };
  const renderQueryAssistButton = (isCollapsed: boolean) => {
    const component = render(
      <div>
        <QueryAssistButton
          dependencies={{
            ...props.dependencies,
            isCollapsed,
          }}
        />
      </div>
    );
    return component;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('if query editor collapsed, click button to expand', async () => {
    useQueryAssist.mockImplementationOnce(() => ({
      isQueryAssistCollapsed: true,
      updateIsQueryAssistCollapsed,
    }));
    renderQueryAssistButton(true);
    expect(screen.getByTestId('queryAssist_summary_button')).toBeInTheDocument();
    await screen.getByTestId('queryAssist_summary_button');
    fireEvent.click(screen.getByTestId('queryAssist_summary_button'));
    expect(setIsCollapsed).toHaveBeenCalledWith(false);
    expect(updateIsQueryAssistCollapsed).toHaveBeenCalledWith(false);
  });

  [true, false].forEach((isQueryAssistCollapsed) => {
    it('if query editor expanded, click button to switch', async () => {
      useQueryAssist.mockImplementationOnce(() => ({
        isQueryAssistCollapsed,
        updateIsQueryAssistCollapsed,
      }));
      renderQueryAssistButton(false);
      expect(screen.getByTestId('queryAssist_summary_button')).toBeInTheDocument();
      await screen.getByTestId('queryAssist_summary_button');
      fireEvent.click(screen.getByTestId('queryAssist_summary_button'));
      expect(setIsCollapsed).not.toHaveBeenCalled();
      expect(updateIsQueryAssistCollapsed).toHaveBeenCalledWith(!isQueryAssistCollapsed);
    });
  });
});
