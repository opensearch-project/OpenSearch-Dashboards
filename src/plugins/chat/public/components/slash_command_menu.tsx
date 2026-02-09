/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { EuiPanel, EuiText, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { SlashCommand } from '../services/slash_commands';
import './slash_command_menu.scss';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  commands,
  selectedIndex,
  onSelect,
}) => {
  if (commands.length === 0) return null;

  return (
    <EuiPanel className="slashCommandMenu" paddingSize="none">
      {commands.map((command, index) => (
        <div
          key={command.command}
          className={`slashCommandMenu__item ${
            index === selectedIndex ? 'slashCommandMenu__item--selected' : ''
          }`}
          onClick={() => onSelect(command)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(command);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <EuiFlexGroup gutterSize="xs" alignItems="flexStart" responsive={false}>
            <EuiFlexItem>
              <div>
                <EuiText size="xs">
                  <strong>/{command.command}</strong>
                </EuiText>
                {command.description && (
                  <EuiText size="xs" color="subdued">
                    {command.description}
                  </EuiText>
                )}
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ))}
    </EuiPanel>
  );
};
