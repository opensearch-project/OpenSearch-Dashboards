/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export interface QueryAssistState {
  question: string;
  answer: string;
}

export interface QueryAssistContextValue {
  isQueryAssistCollapsed: boolean;
  updateIsQueryAssistCollapsed: (isCollapsed: boolean) => void;
  queryState: QueryAssistState;
  updateQueryState: (state: QueryAssistState) => void;
}
export const QueryAssistContext = React.createContext<QueryAssistContextValue>(
  {} as QueryAssistContextValue
);
export const useQueryAssist = () => React.useContext(QueryAssistContext);
