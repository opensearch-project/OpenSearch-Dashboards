/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../..';

export const getSavedVisBuilderVis = async (
  services: VisBuilderServices,
  visBuilderVisId?: string
) => {
  const { savedVisBuilderLoader } = services;
  if (!savedVisBuilderLoader) {
    return {};
  }
  const savedVisBuilderVis = await savedVisBuilderLoader.get(visBuilderVisId);

  return savedVisBuilderVis;
};
