/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Context passed to log actions containing document data and query information
 */
export interface LogActionContext {
  /** The source document data */
  document: Record<string, any>;
  /** Current query context if available */
  query?: string;
  /** Index pattern or data source information */
  indexPattern?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Result returned by action execution
 */
export interface LogActionResult {
  /** Whether the action was successful */
  success: boolean;
  /** Optional error message if action failed */
  error?: string;
  /** Optional data returned by the action */
  data?: any;
}

/**
 * Props passed to log action components
 */
export interface LogActionItemProps {
  /** The action context containing document data */
  context: LogActionContext;
  /** The action definition */
  action: LogActionDefinition;
  /** Function to close the action panel */
  onClose: () => void;
  /** Optional callback for handling action results */
  onResult?: (result: LogActionResult) => void;
}

/**
 * Definition for a log action that can be registered and executed
 */
export interface LogActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Display name shown in the menu */
  displayName: string;
  /** Icon type from EUI icon set */
  iconType: string;
  /** Order in which action appears in menu (lower numbers first) */
  order: number;
  /** Whether this action is available for the given context */
  isCompatible: (context: LogActionContext) => boolean;
  /** React component that handles the action's UI and execution */
  component: React.ComponentType<LogActionItemProps>;
}

/**
 * Registry for managing log actions
 */
export interface LogActionRegistry {
  /** Register a new action */
  registerAction: (action: LogActionDefinition) => void;
  /** Unregister an action by ID */
  unregisterAction: (actionId: string) => void;
  /** Get all registered actions compatible with the given context */
  getCompatibleActions: (context: LogActionContext) => LogActionDefinition[];
  /** Get a specific action by ID */
  getAction: (actionId: string) => LogActionDefinition | undefined;
}
