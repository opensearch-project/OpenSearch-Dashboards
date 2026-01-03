/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BaseActionDefinition } from './base_actions';

/**
 * Field selection context for smart actions
 */
export interface FieldSelectionContext {
  selectedText: string;
  fieldName: string;
  fieldType: string;
  fieldValue: any;
  documentId: string;
  rowIndex: number;
  element: HTMLElement;
}

/**
 * Context passed to smart actions containing field selection data
 */
export interface SmartActionContext {
  /** Field selection context from user interaction */
  fieldContext: FieldSelectionContext;
}

/**
 * Result returned by smart action execution
 */
export interface SmartActionResult {
  /** Whether the action was successful */
  success: boolean;
  /** Optional error message if action failed */
  error?: string;
  /** Optional data returned by the action */
  data?: any;
}

/**
 * Props passed to smart action components
 */
export interface SmartActionItemProps {
  /** The smart action context containing field selection data */
  context: SmartActionContext;
  /** The action definition */
  action: SmartActionDefinition;
  /** Function to close the action panel */
  onClose: () => void;
  /** Optional callback for handling action results */
  onResult?: (result: SmartActionResult) => void;
}

/**
 * Definition for a smart action that can be registered and executed
 */
export interface SmartActionDefinition extends BaseActionDefinition {
  /** Description of what the action does */
  description: string;
  /** Whether this action is available for the given context */
  isCompatible: (context: SmartActionContext) => boolean;
  /** React component that handles the action's UI and execution */
  component: React.ComponentType<SmartActionItemProps>;
}

/**
 * Registry for managing smart actions
 */
export interface SmartActionRegistry {
  /** Register a new smart action */
  registerAction: (action: SmartActionDefinition) => void;
  /** Unregister a smart action by ID */
  unregisterAction: (actionId: string) => void;
  /** Get all registered actions compatible with the given context */
  getCompatibleActions: (context: SmartActionContext) => SmartActionDefinition[];
  /** Get a specific action by ID */
  getAction: (actionId: string) => SmartActionDefinition | undefined;
}
