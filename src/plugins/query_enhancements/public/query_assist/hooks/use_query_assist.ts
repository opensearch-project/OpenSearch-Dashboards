/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BehaviorSubject } from 'rxjs';

export interface QueryAssistContextValue {
  question: string;
  question$: BehaviorSubject<string>;
  updateQuestion: (question: string) => void;
  isQuerySummaryCollapsed: boolean;
}
export const QueryAssistContext = React.createContext<QueryAssistContextValue>(
  {} as QueryAssistContextValue
);
export const useQueryAssist = () => React.useContext(QueryAssistContext);
