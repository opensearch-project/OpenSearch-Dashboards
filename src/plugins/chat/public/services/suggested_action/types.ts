/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Message } from '../../../common/types';

/**
 * Context information passed to suggestion providers
 */
export interface ChatContext {
  conversationId?: string;
  currentMessage?: Message;
  messageHistory: Message[];
  dataSourceId?: string;
  pageContext?: Record<string, string>; // context for current page
}

export interface SuggestedActions {
  actionType: string;
  message: string;
  action: () => Promise<boolean>;
}

/**
 * Interface for plugins to implement when providing custom suggestions
 */
export interface SuggestedActionsProvider {
  /** Unique identifier for the provider */
  id: string;
  /** Priority for ordering suggestions (higher numbers appear first) */
  priority?: number;
  /** Method to get suggestions based on chat context */
  getSuggestions: (context: ChatContext) => Promise<SuggestedActions[]> | SuggestedActions[];
  /** Optional method to check if provider is enabled */
  isEnabled?: () => boolean;
}

/**
 * Contract interface for the suggested actions service setup
 */
export interface SuggestedActionsServiceSetupContract {
  /** Register a new suggestion provider */
  registerProvider(provider: SuggestedActionsProvider): void;
  /** Unregister a suggestion provider by ID */
  unregisterProvider(providerId: string): void;
  /** Get all custom suggestions for the given context */
  getCustomSuggestions(context: ChatContext): Promise<SuggestedActions[]>;
}

/**
 * Contract interface for the suggested actions service start
 */
export type SuggestedActionsServiceStartContract = SuggestedActionsServiceSetupContract;
