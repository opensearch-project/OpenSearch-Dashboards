/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderViewServices } from '../../../types';
import { useIndexPattern } from '../../utils/use';
import { useTypedSelector, getVisBuilderRootState } from '../../utils/state_management';
import { useSavedVisBuilderVis } from '../../utils/use';
import { extractSavedVisBuilderId } from '../../../extract_id';
import { syncQueryStateWithUrl } from '../../../../../data/public';

export const useVisBuilderState = (services: VisBuilderViewServices) => {
  const {
    data: { query },
    osdUrlStateStorage,
  } = services;
  const indexPattern = useIndexPattern(services);
  const rootState = useTypedSelector((state) => getVisBuilderRootState(state));
  const path = window.location.pathname;
  const savedVisBuilderId = rootState.editor.savedVisBuilderId || extractSavedVisBuilderId(path);
  const savedVisBuilderVis = useSavedVisBuilderVis(services, savedVisBuilderId);
  // syncs `_g` portion of url with query services
  syncQueryStateWithUrl(query, osdUrlStateStorage);
  return { indexPattern, rootState, savedVisBuilderId, savedVisBuilderVis };
};

export type VisBuilderContextValue = ReturnType<typeof useVisBuilderState>;
