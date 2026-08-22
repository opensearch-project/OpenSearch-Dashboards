/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatServiceStart } from '../../../../../core/public';

/**
 * Module-level holder for the core chat service reference.
 * Set during the embeddable plugin's start() lifecycle so that
 * ErrorEmbeddable can access the chat service without prop drilling.
 */
let chatService: ChatServiceStart | undefined;

export function setChatService(service: ChatServiceStart | undefined) {
  chatService = service;
}

export function getChatService(): ChatServiceStart | undefined {
  return chatService;
}
