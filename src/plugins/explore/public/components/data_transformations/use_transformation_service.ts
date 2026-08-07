/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { TransformationService } from './transformation_service';
import { registerAllTransformations } from './register_all_transformations';
import { VisualizationBuilder } from '../visualizations/visualization_builder';
import { getServices } from '../../services/services';

interface Options {
  onPipelineChange?: () => void;
}

export const useTransformationService = (
  visualizationBuilder: VisualizationBuilder,
  options?: Options
) => {
  const serviceRef = useRef<TransformationService>();

  if (!serviceRef.current) {
    const service = new TransformationService();
    registerAllTransformations(service);

    visualizationBuilder.setTransformationService(service);

    const { osdUrlStateStorage } = getServices();
    if (osdUrlStateStorage) {
      service.initUrlSync(osdUrlStateStorage);
    }
    serviceRef.current = service;
  }

  const transformationService = serviceRef.current;

  useEffect(() => {
    return () => {
      transformationService.destroy();
    };
  }, [transformationService]);

  useEffect(() => {
    if (!options?.onPipelineChange) return;
    const subscription = transformationService.pipeline$.subscribe(options.onPipelineChange);
    return () => subscription.unsubscribe();
  }, [transformationService, options?.onPipelineChange]);

  return transformationService;
};
