/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypedUseSelectorHook } from 'react-redux';
import { RootState, useTypedDispatch, useTypedSelector } from '../../../../../data_explorer/public';
import { DiscoverState } from './discover_slice';
import { DiscoverContextState } from './discover_context_slice';

export {
  addDiscoverColumn,
  removeDiscoverColumn,
  reorderDiscoverColumn,
  setDiscoverColumns,
  setDiscoverState,
  setDiscoverSort,
  updateDiscoverState
} from './discover_slice';
export {
  addContextColumn,
  removeContextColumn,
  reorderContextColumn,
  setContextColumns,
  setContextSort,
  setContextState,
  setAnchorId,
  setAnchor,
  setPredecessorCount,
  setPredecessors,
  setSuccessorCount,
  setSuccessors,
  setContextFetchStatus,
  setContextFilters,
  updateContextState,
} from './discover_context_slice';

export interface DiscoverRootState extends RootState {
  discover: DiscoverState;
  discoverContext: DiscoverContextState;
}

export const useSelector: TypedUseSelectorHook<DiscoverRootState> = useTypedSelector;
export const useDispatch = useTypedDispatch;
