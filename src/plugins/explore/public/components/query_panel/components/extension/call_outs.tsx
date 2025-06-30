/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiCallOutProps } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

interface PromptCallOutProps extends Required<Pick<EuiCallOutProps, 'onDismiss'>> {
  language: string;
  type: PromptCallOutType;
}

export type PromptCallOutType =
  | undefined
  | 'invalid_query'
  | 'prohibited_query'
  | 'empty_query'
  | 'empty_index'
  | 'query_generated';

const EmptyIndexCallOut: React.FC<PromptCallOutProps> = (props) => (
  <EuiCallOut
    className="queryPanel__callout"
    data-test-subj="query-panel-empty-index-callout"
    title={
      <FormattedMessage
        id="queryPanel.callOut.emptyIndex.title"
        defaultMessage="Select a data source or index to ask a question."
      />
    }
    size="s"
    color="warning"
    iconType="help"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const ProhibitedQueryCallOut: React.FC<PromptCallOutProps> = (props) => (
  <EuiCallOut
    className="queryPanel__callout"
    data-test-subj="query-panel-guard-callout"
    title={
      <FormattedMessage
        id="queryPanel.callOut.prohibitedQuery.title"
        defaultMessage="I am unable to respond to this query. Try another question."
      />
    }
    size="s"
    color="danger"
    iconType="alert"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const EmptyQueryCallOut: React.FC<PromptCallOutProps> = (props) => (
  <EuiCallOut
    className="queryPanel__callout"
    data-test-subj="query-panel-empty-query-callout"
    title={
      <FormattedMessage
        id="queryPanel.callOut.emptyQuery.title"
        defaultMessage="Enter a natural language question to automatically generate a query to view results."
      />
    }
    size="s"
    color="warning"
    iconType="help"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const QueryGeneratedCallOut: React.FC<PromptCallOutProps> = (props) => (
  <EuiCallOut
    className="queryPanel__callout"
    data-test-subj="query-panel-query-generated-callout"
    title={
      <FormattedMessage
        id="queryPanel.callOut.queryGenerated.title"
        defaultMessage="{language} query generated. If there are any issues with the response, try adding more context to the question or a new question to submit."
        values={{ language: props.language }}
      />
    }
    size="s"
    color="success"
    iconType="check"
    dismissible
    onDismiss={props.onDismiss}
  />
);

export const PromptCallOut: React.FC<PromptCallOutProps> = (props) => {
  switch (props.type) {
    case 'empty_query':
      return <EmptyQueryCallOut {...props} />;
    case 'empty_index':
      return <EmptyIndexCallOut {...props} />;
    case 'invalid_query':
      return <ProhibitedQueryCallOut {...props} />;
    case 'query_generated':
      return <QueryGeneratedCallOut {...props} />;
    default:
      break;
  }
  return null;
};
