/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { AgentTracesGetStarted, AgentTracesNoAgentData } from './agent_traces_empty_states';
import {
  AGENT_TRACING_DOCS_URL,
  AI_OBSERVABILITY_DOCS_URL,
  PYTHON_AGENT_SETUP_DOCS_URL,
} from './links';

const renderWithI18n = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

describe('AgentTracesGetStarted', () => {
  it('explains Agent Traces and links to the setup docs', () => {
    renderWithI18n(<AgentTracesGetStarted />);

    expect(screen.getByText('Start tracing your AI agents')).toBeInTheDocument();
    expect(
      screen.getByText(/Select their trace dataset from the dataset picker/)
    ).toBeInTheDocument();
    expect(screen.getByTestId('agentTracesEmptyStatePrimaryLink')).toHaveAttribute(
      'href',
      AI_OBSERVABILITY_DOCS_URL
    );
    expect(screen.getByTestId('agentTracesEmptyStatePythonLink')).toHaveAttribute(
      'href',
      PYTHON_AGENT_SETUP_DOCS_URL
    );
  });
});

describe('AgentTracesNoAgentData', () => {
  it('names the dataset and links to the agent tracing docs', () => {
    renderWithI18n(<AgentTracesNoAgentData datasetTitle="apm-span-*" />);

    expect(screen.getByText('No agent traces in this dataset')).toBeInTheDocument();
    expect(screen.getByText('apm-span-*')).toBeInTheDocument();
    expect(screen.getByText('gen_ai.operation.name')).toBeInTheDocument();
    expect(screen.getByText(/Select another trace dataset/)).toBeInTheDocument();
    expect(screen.getByTestId('agentTracesEmptyStatePrimaryLink')).toHaveAttribute(
      'href',
      AGENT_TRACING_DOCS_URL
    );
    expect(screen.getByTestId('agentTracesEmptyStatePythonLink')).toHaveAttribute(
      'href',
      PYTHON_AGENT_SETUP_DOCS_URL
    );
  });

  it('reads without a dataset title', () => {
    renderWithI18n(<AgentTracesNoAgentData />);

    expect(screen.getByText(/This dataset has no spans with GenAI attributes/)).toBeInTheDocument();
  });
});
