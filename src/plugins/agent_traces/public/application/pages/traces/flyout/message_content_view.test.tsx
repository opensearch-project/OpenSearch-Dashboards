/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import {
  MessageContent,
  MessageViewModeToggle,
  copyTextFor,
  toDisplayMessages,
  toPrettyJson,
} from './message_content_view';

jest.mock('@elastic/eui', () => {
  const actual = jest.requireActual('@elastic/eui');
  return {
    ...actual,
    // Render markdown as plain text in tests (the real component parses asynchronously)
    EuiMarkdownFormat: ({ children }: { children: string }) => (
      <div data-test-subj="markdown">{children}</div>
    ),
  };
});

const chat = JSON.stringify([
  { role: 'system', parts: [{ type: 'text', content: 'You are helpful' }] },
  { role: 'user', parts: [{ type: 'text', content: '**Plan** a trip' }] },
  { role: 'assistant', parts: [{ type: 'tool_call', name: 'get_weather' }] },
]);

describe('message_content_view', () => {
  it('splits semconv messages into role-labeled display messages', () => {
    expect(toDisplayMessages(chat)).toEqual([
      { role: 'system', text: 'You are helpful' },
      { role: 'user', text: '**Plan** a trip' },
      { role: 'assistant', text: '[tool_call: get_weather]' },
    ]);
    expect(toDisplayMessages('plain')).toEqual([{ role: null, text: 'plain' }]);
    expect(toDisplayMessages('—')).toEqual([]);
  });

  it('pretty-prints JSON strings and structured values', () => {
    expect(toPrettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(toPrettyJson({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(toPrettyJson('not json')).toBe('not json');
    expect(toPrettyJson(undefined)).toBe('');
  });

  it('renders formatted messages with roles, and raw JSON in json mode', () => {
    const { rerender } = render(<MessageContent value={chat} mode="formatted" />);
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('**Plan** a trip')).toBeInTheDocument();
    expect(screen.getByText('[tool_call: get_weather]')).toBeInTheDocument();

    rerender(<MessageContent value={chat} mode="json" />);
    expect(screen.queryByText('User')).not.toBeInTheDocument();
    expect(screen.getByText(/"role": "user"/)).toBeInTheDocument();
  });

  it('uses formattedText when given and shows the empty text otherwise', () => {
    const { rerender } = render(
      <MessageContent value={chat} mode="formatted" formattedText="just this turn" />
    );
    expect(screen.getByText('just this turn')).toBeInTheDocument();
    rerender(<MessageContent value="—" mode="formatted" emptyText="nothing" />);
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  it('copies what is shown in the current mode', () => {
    expect(copyTextFor(chat, 'formatted')).toBe(
      'system: You are helpful\n\nuser: **Plan** a trip\n\nassistant: [tool_call: get_weather]'
    );
    expect(copyTextFor(chat, 'formatted', 'turn text')).toBe('turn text');
    expect(copyTextFor('{"a":1}', 'json')).toBe('{\n  "a": 1\n}');
  });

  it('toggles between Formatted and JSON', () => {
    const onChange = jest.fn();
    render(<MessageViewModeToggle mode="formatted" onChange={onChange} idPrefix="t" />);
    fireEvent.click(screen.getByText('JSON'));
    expect(onChange).toHaveBeenCalledWith('json');
  });
});
