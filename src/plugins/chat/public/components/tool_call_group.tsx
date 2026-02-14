/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiAccordion, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TimelineToolCall, ToolCallRow } from './tool_call_row';

import './tool_call_group.scss';

export const ToolCallGroup = ({ toolCalls }: { toolCalls: TimelineToolCall[] }) => {
  const id = toolCalls.map((toolCall) => toolCall.id).join('-');

  return (
    <EuiAccordion
      id={id}
      arrowDisplay="right"
      buttonContent={
        <EuiFlexGroup alignItems="center" gutterSize="xs">
          <EuiFlexItem grow={false}>
            <EuiIcon size="m" type="checkInCircleEmpty" color="success" />
          </EuiFlexItem>
          <EuiFlexItem>
            {i18n.translate('chat.tooCallGroup.buttonLabel', {
              defaultMessage: '{toolCount} tasks performed',
              values: {
                toolCount: toolCalls.length,
              },
            })}
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    >
      <EuiSpacer size="xs" />
      <div className="toolCallGroup__Content">
        {toolCalls.map((toolCall) => (
          <ToolCallRow key={toolCall.id} toolCall={toolCall} initialOpen />
        ))}
      </div>
    </EuiAccordion>
  );
};
