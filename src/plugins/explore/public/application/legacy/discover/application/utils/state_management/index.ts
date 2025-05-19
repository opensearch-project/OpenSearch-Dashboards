/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TypedUseSelectorHook,
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
} from 'react-redux';
import { RootState } from '../../../../../utils/state_management/store';
import { setDataset } from '../../../../../utils/state_management/slices/query_slice';

// Legacy state management has been migrated to main Redux store
// This file now just re-exports the main store functionality for compatibility

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
export const useDispatch = useReduxDispatch;
export const updateIndexPattern = setDataset;
