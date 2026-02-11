/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ChatContextPopover } from './chat_context_popover';

describe('ChatContextPopover', () => {
  it('should render null when disabled', () => {
    const { container } = render(<ChatContextPopover enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null when options are empty', () => {
    const { container } = render(<ChatContextPopover enabled={true} options={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render button when enabled with options', () => {
    const { getByLabelText } = render(<ChatContextPopover enabled={true} />);
    expect(getByLabelText('Add context')).toBeTruthy();
  });

  it('should open popover on button click', () => {
    const { getByLabelText, getByText } = render(<ChatContextPopover enabled={true} />);
    fireEvent.click(getByLabelText('Add context'));
    expect(getByText('Add dashboard screenshot')).toBeTruthy();
  });

  it('should call onClick and close popover when option is clicked', async () => {
    const mockOnClick = jest.fn();
    const options = [{ title: 'Test Option', iconType: 'test', onClick: mockOnClick }];

    const { getByLabelText, getByText, queryByText } = render(
      <ChatContextPopover enabled={true} options={options} />
    );

    fireEvent.click(getByLabelText('Add context'));
    fireEvent.click(getByText('Test Option'));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(queryByText('Test Option')).toBeNull());
  });

  it('should render multiple options', () => {
    const options = [
      { title: 'Option 1', iconType: 'icon1', onClick: jest.fn() },
      { title: 'Option 2', iconType: 'icon2', onClick: jest.fn() },
    ];

    const { getByLabelText, getByText } = render(
      <ChatContextPopover enabled={true} options={options} />
    );

    fireEvent.click(getByLabelText('Add context'));
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
  });
});
