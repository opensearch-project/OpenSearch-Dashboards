/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiCallOutProps } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

interface QueryAssistCallOutProps extends Required<Pick<EuiCallOutProps, 'onDismiss'>> {
  language: string;
  type: QueryAssistCallOutType;
}

export type QueryAssistCallOutType =
  | undefined
  | 'invalid_query'
  | 'prohibited_query'
  | 'empty_query'
  | 'empty_index'
  | 'query_generated';

const EmptyIndexCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    className="queryAssist queryAssist__callout"
    data-test-subj="query-assist-empty-index-callout"
    title={
      <FormattedMessage
        id="queryEnhancements.callOut.emptyIndex.title"
        defaultMessage="Select a data source or index to ask a question."
      />
    }
    size="s"
    color="warning"
    iconType="iInCircle"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const ProhibitedQueryCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    className="queryAssist queryAssist__callout"
    data-test-subj="query-assist-guard-callout"
    title={
      <FormattedMessage
        id="queryEnhancements.callOut.prohibitedQuery.title"
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

const EmptyQueryCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    className="queryAssist queryAssist__callout"
    data-test-subj="query-assist-empty-query-callout"
    title={
      <FormattedMessage
        id="queryEnhancements.callOut.emptyQuery.title"
        defaultMessage="Enter a natural language question to automatically generate a query to view results."
      />
    }
    size="s"
    color="warning"
    iconType="iInCircle"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const QueryGeneratedCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    className="queryAssist queryAssist__callout"
    data-test-subj="query-assist-query-generated-callout"
    title={
      <FormattedMessage
        id="queryEnhancements.callOut.queryGenerated.title"
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

export const QueryAssistCallOut: React.FC<QueryAssistCallOutProps> = (props) => {
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
