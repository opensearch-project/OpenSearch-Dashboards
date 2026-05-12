/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect } from 'react';
import { TransformationService } from '../data_transformations/transformation_service';
import { useQueryBuilderState } from './use_query_builder_state';
import { useVisualizationBuilder } from './use_visualization_builder';
import { getServices } from '../../../services/services';
import { registerAllTransformations, UrlTransformationState } from '../data_transformations';

let globalTransformationService: TransformationService | undefined;

export const useTransformationService = (
  savedTransformationPipeline?: UrlTransformationState[]
): TransformationService => {
  const { queryBuilder } = useQueryBuilderState();
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();

  const transformationService = useMemo(() => {
    if (globalTransformationService) {
      return globalTransformationService;
    }

    const service = new TransformationService();
    registerAllTransformations(service);

    globalTransformationService = service;
    return service;
  }, []);

  // set transformation service with VisualizationBuilder.
  useEffect(() => {
    if (!transformationService) return;
    visualizationBuilder.setTransformationService(transformationService);
    // clear the pipeline when the user switches datasets
    queryBuilder.setOnDatasetChanged(() => transformationService.clearPipeline());
    // mark editor dirty whenever the pipeline changes
    const subscription = transformationService.pipeline$.subscribe(() => {
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
    });
    return () => subscription.unsubscribe();
  }, [queryBuilder, visualizationBuilder, transformationService]);

  // init URL sync
  useEffect(() => {
    const { osdUrlStateStorage } = getServices();
    if (osdUrlStateStorage) {
      transformationService.initUrlSync(osdUrlStateStorage);
    }
  }, [transformationService]);

  // restore saved pipeline when it arrives from the saved object
  useEffect(() => {
    if (!savedTransformationPipeline || savedTransformationPipeline.length === 0) return;
    transformationService.restoreFromState(savedTransformationPipeline);
  }, [savedTransformationPipeline, transformationService]);

  return transformationService;
};

export const cleanupGlobalTransformationService = () => {
  if (globalTransformationService) {
    globalTransformationService.destroy();
    globalTransformationService = undefined;
  }
};
