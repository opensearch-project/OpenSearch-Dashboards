/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextMessageManager } from '../text_message_manager';

describe('TextMessageManager accumulated text', () => {
  const observer = { next: jest.fn() };

  it('separates consecutive text blocks with a newline', () => {
    const manager = new TextMessageManager();
    manager.startMessage(observer, 'thread', 'run');
    manager.emitContent('CONVERSATION_TITLE: List Cluster Indices', observer, 'thread', 'run');
    manager.interruptForTools(observer, 'thread', 'run');
    manager.resumeAfterTools(observer, 'thread', 'run');
    manager.emitContent('Here are your indices.', observer, 'thread', 'run');

    expect(manager.getAccumulatedText()).toBe(
      'CONVERSATION_TITLE: List Cluster Indices\nHere are your indices.'
    );
  });

  it('does not add a newline when the previous block already ends with one', () => {
    const manager = new TextMessageManager();
    manager.startMessage(observer, 'thread', 'run');
    manager.emitContent('First block\n', observer, 'thread', 'run');
    manager.interruptForTools(observer, 'thread', 'run');
    manager.resumeAfterTools(observer, 'thread', 'run');
    manager.emitContent('Second block', observer, 'thread', 'run');

    expect(manager.getAccumulatedText()).toBe('First block\nSecond block');
  });

  it('does not prefix the first block', () => {
    const manager = new TextMessageManager();
    manager.startMessage(observer, 'thread', 'run');
    manager.emitContent('Only block', observer, 'thread', 'run');

    expect(manager.getAccumulatedText()).toBe('Only block');
  });
});
