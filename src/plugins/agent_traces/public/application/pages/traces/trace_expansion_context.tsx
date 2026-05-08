/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import { BaseRow, LoadingState } from './hooks/tree_utils';

export interface RowMeta {
  level: number;
  isExpandable: boolean;
  traceRow: BaseRow;
}

export interface TraceExpansionState {
  expandedRows: Set<string>;
  toggleExpansion: (e: React.MouseEvent, id: string, traceId: string) => void;
  traceLoadingState: Map<string, LoadingState>;
  getRowMeta: (hitId: string) => RowMeta | null;
  onRowClick?: (hitId: string) => void;
  wrapCellText?: boolean;
  hasExpandableRows?: boolean;
}

const TraceExpansionContext = createContext<TraceExpansionState | null>(null);

export const TraceExpansionProvider = TraceExpansionContext.Provider;

export const useTraceExpansion = (): TraceExpansionState | null => {
  return useContext(TraceExpansionContext);
};
