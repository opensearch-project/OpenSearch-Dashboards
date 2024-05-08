/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { DataSelectorRefresher } from './data_selector_refresher'; // adjust the import path as necessary
import { DATA_SELECTOR_REFRESHER_POPOVER_TEXT } from '../constants';
import { ToolTipDelay } from '@elastic/eui/src/components/tool_tip/tool_tip';
import { EuiToolTipProps } from '@elastic/eui';

describe('DataSelectorRefresher', () => {
  const tooltipText = DATA_SELECTOR_REFRESHER_POPOVER_TEXT;
  const onRefreshMock = jest.fn();

  it('renders correctly with given tooltip text', () => {
    const container = render(
      <DataSelectorRefresher tooltipText={tooltipText} onRefresh={onRefreshMock} />
    );

    const refreshButton = container.getByLabelText('sourceRefresh');
    fireEvent.mouseOver(refreshButton);

    waitFor(() => {
      expect(container.getByText(tooltipText)).toBeInTheDocument();
    });
  });

  it('calls onRefresh when button is clicked', () => {
    const container = render(
      <DataSelectorRefresher tooltipText={tooltipText} onRefresh={onRefreshMock} />
    );

    fireEvent.click(container.getByLabelText('sourceRefresh'));
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
  });

  it('applies additional button properties', () => {
    const buttonProps = {
      'aria-label': 'Custom Aria Label',
    };

    render(
      <DataSelectorRefresher
        tooltipText={tooltipText}
        onRefresh={onRefreshMock}
        buttonProps={buttonProps}
      />
    );

    const button = screen.getByTestId('sourceRefreshButton');
    expect(button).toHaveAttribute('aria-label', 'Custom Aria Label');
  });

  it('applies additional tooltip properties', () => {
    const toolTipProps: Partial<EuiToolTipProps> = {
      delay: 'long' as ToolTipDelay,
    };

    const container = render(
      <DataSelectorRefresher
        tooltipText={tooltipText}
        onRefresh={onRefreshMock}
        toolTipProps={toolTipProps}
      />
    );

    const refreshButton = container.getByLabelText('sourceRefresh');
    fireEvent.mouseOver(refreshButton);
    waitFor(() => {
      const tooltip = screen.getByTestId('sourceRefreshButtonToolTip');
      expect(tooltip).toHaveAttribute('delay', 'long');
    });
  });
});
