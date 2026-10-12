/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiDescriptionList, EuiSpacer, EuiText } from '@elastic/eui';
import { readAttribute } from '../hooks/genai_message_preview';
import './genai_attributes.scss';

interface AttributeGroup {
  title: string;
  keys: string[];
}

/**
 * OTel GenAI semantic convention attributes worth reading on a span, grouped for triage.
 * Message content, system instructions, tool definitions and tool arguments/results are
 * left out: they are shown in Input / Output and Raw Span.
 * Source: semantic-conventions-genai registry (docs/registry/attributes/gen-ai.md).
 */
export const GENAI_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    title: i18n.translate('agentTraces.genAiAttributes.agent', { defaultMessage: 'Agent' }),
    keys: [
      'gen_ai.agent.name',
      'gen_ai.agent.id',
      'gen_ai.agent.version',
      'gen_ai.agent.description',
      'gen_ai.workflow.name',
    ],
  },
  {
    title: i18n.translate('agentTraces.genAiAttributes.model', { defaultMessage: 'Model' }),
    keys: [
      'gen_ai.provider.name',
      'gen_ai.request.model',
      'gen_ai.response.model',
      'gen_ai.response.finish_reasons',
      'gen_ai.response.id',
      'gen_ai.output.type',
      'gen_ai.request.temperature',
      'gen_ai.request.max_tokens',
      'gen_ai.request.top_p',
      'gen_ai.request.reasoning.level',
    ],
  },
  {
    title: i18n.translate('agentTraces.genAiAttributes.tool', { defaultMessage: 'Tool' }),
    keys: [
      'gen_ai.tool.name',
      'gen_ai.tool.type',
      'gen_ai.tool.call.id',
      'gen_ai.tool.description',
    ],
  },
  {
    title: i18n.translate('agentTraces.genAiAttributes.usage', { defaultMessage: 'Usage' }),
    keys: [
      'gen_ai.usage.input_tokens',
      'gen_ai.usage.output_tokens',
      'gen_ai.usage.cache_read.input_tokens',
      'gen_ai.usage.cache_write.input_tokens',
      'gen_ai.usage.reasoning.output_tokens',
    ],
  },
  {
    title: i18n.translate('agentTraces.genAiAttributes.context', { defaultMessage: 'Context' }),
    keys: [
      'gen_ai.conversation.id',
      'gen_ai.data_source.id',
      'gen_ai.prompt.name',
      'gen_ai.prompt.version',
      'gen_ai.skill.name',
      'gen_ai.memory.store.id',
      'error.type',
    ],
  },
];

const formatValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
};

/** The groups and attributes present on a span document, in display order. */
export const presentGenAiAttributes = (
  doc: Record<string, unknown> | undefined
): Array<{ title: string; items: Array<{ key: string; value: string }> }> =>
  GENAI_ATTRIBUTE_GROUPS.map((group) => ({
    title: group.title,
    items: group.keys
      .map((key) => ({ key, raw: readAttribute(doc, key) }))
      .filter(({ raw }) => raw !== undefined && raw !== null && raw !== '')
      .map(({ key, raw }) => ({ key, value: formatValue(raw) })),
  })).filter((group) => group.items.length > 0);

/** GenAI semantic convention attributes of the selected span, grouped. Renders nothing if none. */
export const GenAiAttributes: React.FC<{ doc: Record<string, unknown> | undefined }> = ({
  doc,
}) => {
  const groups = presentGenAiAttributes(doc);
  if (groups.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        {i18n.translate('agentTraces.genAiAttributes.none', {
          defaultMessage: 'No GenAI attributes on this span.',
        })}
      </EuiText>
    );
  }
  return (
    <div className="agtGenAiAttributes" data-test-subj="agentTracesGenAiAttributes">
      {groups.map((group, i) => (
        <div key={group.title} data-test-subj={`agentTracesGenAiGroup-${group.title}`}>
          {i > 0 && <EuiSpacer size="s" />}
          <EuiText size="xs">
            <strong>{group.title}</strong>
          </EuiText>
          <EuiDescriptionList
            compressed
            type="column"
            className="agtGenAiAttributes__list"
            listItems={group.items.map(({ key, value }) => ({
              title: key,
              description: value,
            }))}
          />
        </div>
      ))}
    </div>
  );
};
