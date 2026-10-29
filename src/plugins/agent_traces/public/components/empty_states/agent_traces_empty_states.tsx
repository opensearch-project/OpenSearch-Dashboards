/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import {
  AGENT_TRACING_DOCS_URL,
  AI_OBSERVABILITY_DOCS_URL,
  GENAI_SEMCONV_URL,
  PYTHON_AGENT_SETUP_DOCS_URL,
} from './links';

const SetupLinks: React.FC<{ primaryHref: string; primaryLabel: React.ReactNode }> = ({
  primaryHref,
  primaryLabel,
}) => (
  <EuiFlexGroup direction="column" alignItems="center" gutterSize="s" responsive={false}>
    <EuiFlexItem grow={false}>
      <EuiButton
        fill
        href={primaryHref}
        target="_blank"
        iconType="popout"
        iconSide="right"
        data-test-subj="agentTracesEmptyStatePrimaryLink"
      >
        {primaryLabel}
      </EuiButton>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiLink
        href={PYTHON_AGENT_SETUP_DOCS_URL}
        target="_blank"
        external
        data-test-subj="agentTracesEmptyStatePythonLink"
      >
        <FormattedMessage
          id="agentTraces.emptyState.pythonSetupLink"
          defaultMessage="Instrument a Python agent"
        />
      </EuiLink>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/** Shown when no dataset is selected, for example before any trace dataset exists. */
export const AgentTracesGetStarted: React.FC = () => (
  <EuiEmptyPrompt
    iconType="apmTrace"
    data-test-subj="agentTracesGetStarted"
    title={
      <h2>
        <FormattedMessage
          id="agentTraces.emptyState.getStarted.title"
          defaultMessage="Start tracing your AI agents"
        />
      </h2>
    }
    body={
      <>
        <p>
          <FormattedMessage
            id="agentTraces.emptyState.getStarted.body"
            defaultMessage="Agent Traces lists the runs of your AI agents and LLM applications, with their sessions, tool calls, token usage and latency. Send OpenTelemetry traces that follow the {conventions} to OpenSearch."
            values={{
              conventions: (
                <EuiLink href={GENAI_SEMCONV_URL} target="_blank" external>
                  <FormattedMessage
                    id="agentTraces.emptyState.getStarted.conventionsLink"
                    defaultMessage="GenAI semantic conventions"
                  />
                </EuiLink>
              ),
            }}
          />
        </p>
        <p>
          <FormattedMessage
            id="agentTraces.emptyState.getStarted.selectHint"
            defaultMessage="Already sending traces? Select their trace dataset from the dataset picker."
          />
        </p>
      </>
    }
    actions={
      <SetupLinks
        primaryHref={AI_OBSERVABILITY_DOCS_URL}
        primaryLabel={
          <FormattedMessage
            id="agentTraces.emptyState.getStarted.setupLink"
            defaultMessage="Set up AI observability"
          />
        }
      />
    }
  />
);

/**
 * Shown when the selected dataset has no GenAI spans (`gen_ai.operation.name` is not in its
 * mapping), such as an APM span index of services that are not AI agents.
 */
export const AgentTracesNoAgentData: React.FC<{ datasetTitle?: string }> = ({ datasetTitle }) => (
  <EuiEmptyPrompt
    iconType="apmTrace"
    data-test-subj="agentTracesNoAgentData"
    title={
      <h2>
        <FormattedMessage
          id="agentTraces.emptyState.noAgentData.title"
          defaultMessage="No agent traces in this dataset"
        />
      </h2>
    }
    body={
      <>
        <p>
          {datasetTitle ? (
            <FormattedMessage
              id="agentTraces.emptyState.noAgentData.bodyWithDataset"
              defaultMessage="{dataset} has no spans with GenAI attributes such as {attribute}, so there are no agent runs to list."
              values={{
                dataset: <strong>{datasetTitle}</strong>,
                attribute: <code>gen_ai.operation.name</code>,
              }}
            />
          ) : (
            <FormattedMessage
              id="agentTraces.emptyState.noAgentData.body"
              defaultMessage="This dataset has no spans with GenAI attributes such as {attribute}, so there are no agent runs to list."
              values={{ attribute: <code>gen_ai.operation.name</code> }}
            />
          )}
        </p>
        <p>
          <FormattedMessage
            id="agentTraces.emptyState.noAgentData.hint"
            defaultMessage="Select another trace dataset from the dataset picker, or instrument your agents to send GenAI spans."
          />
        </p>
      </>
    }
    actions={
      <SetupLinks
        primaryHref={AGENT_TRACING_DOCS_URL}
        primaryLabel={
          <FormattedMessage
            id="agentTraces.emptyState.noAgentData.learnLink"
            defaultMessage="Learn about agent tracing"
          />
        }
      />
    }
  />
);
