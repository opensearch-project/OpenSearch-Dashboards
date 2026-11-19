/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { VisualizationBuilder } from '../visualizations/visualization_builder';
import { getServices } from '../../services/services';

/**
 * The visualization builder's transformation service, started for this editor: the saved
 * transformations and the URL sync begin on the first render and the URL sync ends on unmount.
 */
export const useTransformationService = (visualizationBuilder: VisualizationBuilder) => {
  const transformationService = visualizationBuilder.getTransformationService();
  const startedRef = useRef(false);

  if (!startedRef.current) {
    startedRef.current = true;
    visualizationBuilder.startTransformations(getServices().osdUrlStateStorage);
  }

  useEffect(() => {
    return () => visualizationBuilder.stopTransformations();
  }, [visualizationBuilder]);

  return transformationService;
};
