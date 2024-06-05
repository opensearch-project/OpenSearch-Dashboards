import { EuiCallOut, EuiCallOutProps } from '@elastic/eui';
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
    data-test-subj="query-assist-empty-index-callout"
    title="Select a data source or index to ask a question."
    size="s"
    color="warning"
    iconType="iInCircle"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const ProhibitedQueryCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    data-test-subj="query-assist-guard-callout"
    title="I am unable to respond to this query. Try another question."
    size="s"
    color="danger"
    iconType="alert"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const EmptyQueryCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    data-test-subj="query-assist-empty-query-callout"
    title="Enter a natural language question to automatically generate a query to view results."
    size="s"
    color="warning"
    iconType="iInCircle"
    dismissible
    onDismiss={props.onDismiss}
  />
);

const QueryGeneratedCallOut: React.FC<QueryAssistCallOutProps> = (props) => (
  <EuiCallOut
    data-test-subj="query-assist-query-generated-callout"
    title={`${props.language} query generated`}
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
