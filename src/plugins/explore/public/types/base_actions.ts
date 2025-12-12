/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base interface for all action definitions (log actions and smart actions)
 */
export interface BaseActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Display name shown in the menu */
  displayName: string;
  /** Icon type from EUI icon set */
  iconType: string;
  /** Order in which action appears in menu (lower numbers first) */
  order: number;
  /** Whether this action is available for the given context */
  isCompatible: (context: any) => boolean;
  /** React component that handles the action's UI and execution */
  component: React.ComponentType<any>;
}

/**
 * Context item for dynamic context registration
 */
export interface ContextItem {
  id: string;
  description: string;
  value: any;
  label?: string;
  categories: string[];
}

/**
 * Configuration for smart action items
 */
export interface SmartActionConfig {
  /** Description of what the action does */
  description: string;
  /** Knowledge context specific to this action */
  knowledgeContext?: ContextItem;
  /** Action-specific apply implementation */
  onApply: (context: any) => Promise<void> | void;
  /** Action-specific preview implementation */
  onPreview: (context: any) => void;
}

import React from 'react';
