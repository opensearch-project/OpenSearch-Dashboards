/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FC, ReactNode } from 'react';
import agui from '@ag-ui/core';

export interface ImageData {
  format: string;
  bytes: string;
}

// Pass through types
export type Role = agui.Role;
export type SystemMessage = agui.SystemMessage;
export type DeveloperMessage = agui.DeveloperMessage;
export type ToolCall = agui.ToolCall;

// Extended message types
export type ToolResult = agui.ToolMessage & {
  toolName?: string;
};

export type AIMessage = agui.AssistantMessage & {
  generativeUI?: (props?: any) => any;
  agentName?: string;
  state?: any;
  image?: ImageData;
};

export type UserMessage = agui.UserMessage & {
  image?: ImageData;
};

export type Message = AIMessage | ToolResult | UserMessage | SystemMessage | DeveloperMessage;

export type ComponentsMap<T extends Record<string, object> = Record<string, object>> = {
  [K in keyof T]: FC<{ children?: ReactNode } & T[K]>;
};

export interface ImageRendererProps {
  /**
   * The image data containing format and bytes
   */
  image: ImageData;

  /**
   * Optional content to display alongside the image
   */
  content?: string;

  /**
   * Additional CSS class name for styling
   */
  className?: string;
}

export interface HintFunctionParams {
  /**
   * The previous state of the agent.
   */
  previousState: any;
  /**
   * The current state of the agent.
   */
  currentState: any;
}

export type HintFunction = (params: HintFunctionParams) => Message | undefined;

export type SystemMessageFunction = (
  contextString: string,
  additionalInstructions?: string
) => string;
