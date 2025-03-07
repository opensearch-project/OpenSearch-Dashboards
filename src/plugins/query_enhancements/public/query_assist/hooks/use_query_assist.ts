/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export interface QueryAssistState {
  question: string;
  generatedQuery: string;
}

export interface QueryAssistContextValue {
  isQuerySummaryCollapsed: boolean;
  isSummaryAgentAvailable: boolean;
  queryState: QueryAssistState;
  updateQueryState: (state: QueryAssistState) => void;
}
export const QueryAssistContext = React.createContext<QueryAssistContextValue>(
  {} as QueryAssistContextValue
);
export const useQueryAssist = () => React.useContext(QueryAssistContext);
