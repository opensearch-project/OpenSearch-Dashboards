/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypedUseSelectorHook } from 'react-redux';
import { DiscoverState } from './discover_slice';
import {
  RootState,
  setIndexPattern as updateIndexPattern,
  useTypedDispatch,
  useTypedSelector,
} from '../../../../../../utils/state_management';

export * from './discover_slice';

export interface DiscoverRootState extends RootState {
  logs: DiscoverState;
}

export const useSelector: TypedUseSelectorHook<DiscoverRootState> = useTypedSelector;
export const useDispatch = useTypedDispatch;
export { updateIndexPattern };
