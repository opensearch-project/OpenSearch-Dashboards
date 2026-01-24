/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlashCommandMenu } from './slash_command_menu';
import { SlashCommand } from '../services/slash_commands';

describe('SlashCommandMenu', () => {
  const mockCommands: SlashCommand[] = [
    {
      command: 'help',
      description: 'Show help information',
      handler: () => 'help',
    },
    {
      command: 'clear',
      description: 'Clear chat history',
      handler: () => 'clear',
    },
    {
      command: 'test',
      description: 'Test command',
      handler: () => 'test',
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all commands', () => {
    render(<SlashCommandMenu commands={mockCommands} selectedIndex={0} onSelect={mockOnSelect} />);

    expect(screen.getByText('/help')).toBeInTheDocument();
    expect(screen.getByText('Show help information')).toBeInTheDocument();
    expect(screen.getByText('/clear')).toBeInTheDocument();
    expect(screen.getByText('Clear chat history')).toBeInTheDocument();
    expect(screen.getByText('/test')).toBeInTheDocument();
    expect(screen.getByText('Test command')).toBeInTheDocument();
  });

  it('should highlight selected command', () => {
    const { container } = render(
      <SlashCommandMenu commands={mockCommands} selectedIndex={1} onSelect={mockOnSelect} />
    );

    const items = container.querySelectorAll('.slashCommandMenu__item');
    expect(items[0]).not.toHaveClass('slashCommandMenu__item--selected');
    expect(items[1]).toHaveClass('slashCommandMenu__item--selected');
    expect(items[2]).not.toHaveClass('slashCommandMenu__item--selected');
  });

  it('should call onSelect when command is clicked', () => {
    render(<SlashCommandMenu commands={mockCommands} selectedIndex={0} onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText('/clear'));

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockCommands[1]);
  });

  it('should call onSelect when Enter key is pressed', () => {
    render(<SlashCommandMenu commands={mockCommands} selectedIndex={0} onSelect={mockOnSelect} />);

    const clearCommand = screen.getByText('/clear').closest('[role="button"]');
    fireEvent.keyDown(clearCommand!, { key: 'Enter' });

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(mockCommands[1]);
  });

  it('should not render when commands array is empty', () => {
    const { container } = render(
      <SlashCommandMenu commands={[]} selectedIndex={0} onSelect={mockOnSelect} />
    );

    expect(container.querySelector('.slashCommandMenu')).not.toBeInTheDocument();
  });
});
