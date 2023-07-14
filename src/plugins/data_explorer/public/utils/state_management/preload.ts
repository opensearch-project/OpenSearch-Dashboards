/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreloadedState } from '@reduxjs/toolkit';
import { getPreloadedState as getPreloadedMetadataState } from './metadata_slice';
import { RootState } from './store';
import { DataExplorerServices } from '../../types';

export const getPreloadedState = async (
  services: DataExplorerServices
): Promise<PreloadedState<RootState>> => {
  const metadataState = await getPreloadedMetadataState(services);

  // TODO: preload view states

  return {
    metadata: metadataState,
  };
};
