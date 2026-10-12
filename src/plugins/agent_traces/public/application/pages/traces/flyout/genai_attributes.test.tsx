/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { GenAiAttributes, presentGenAiAttributes } from './genai_attributes';

const doc = {
  attributes: {
    gen_ai: {
      agent: { name: 'Travel Planner', id: 'tp-1' },
      request: { model: 'claude-haiku' },
      response: { finish_reasons: ['tool_use', 'end_turn'] },
      usage: { input_tokens: 1200, output_tokens: 80 },
      input: { messages: '[{"role":"user"}]' },
    },
    'gen_ai.conversation.id': 'sess-1',
  },
};

describe('GenAiAttributes', () => {
  it('groups the semconv attributes present, reading nested and flat keys', () => {
    expect(presentGenAiAttributes(doc)).toEqual([
      {
        title: 'Agent',
        items: [
          { key: 'gen_ai.agent.name', value: 'Travel Planner' },
          { key: 'gen_ai.agent.id', value: 'tp-1' },
        ],
      },
      {
        title: 'Model',
        items: [
          { key: 'gen_ai.request.model', value: 'claude-haiku' },
          { key: 'gen_ai.response.finish_reasons', value: 'tool_use, end_turn' },
        ],
      },
      {
        title: 'Usage',
        items: [
          { key: 'gen_ai.usage.input_tokens', value: '1,200' },
          { key: 'gen_ai.usage.output_tokens', value: '80' },
        ],
      },
      { title: 'Context', items: [{ key: 'gen_ai.conversation.id', value: 'sess-1' }] },
    ]);
  });

  it('leaves message content out and says so when nothing is present', () => {
    render(<GenAiAttributes doc={doc} />);
    expect(screen.queryByText('gen_ai.input.messages')).not.toBeInTheDocument();
    render(<GenAiAttributes doc={{ attributes: {} }} />);
    expect(screen.getByText('No GenAI attributes on this span.')).toBeInTheDocument();
  });
});
