/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useObservable } from 'react-use';
import {
  TransformPanel as SharedTransformPanel,
  TransformationService,
} from '../../../components/data_transformations';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';

export { TransformPanel as SharedTransformPanel } from '../../../components/data_transformations';

export const TransformPanel = ({
  transformationService,
}: {
  transformationService: TransformationService;
}) => {
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
  const stageSchemas = useObservable(
    visualizationBuilder.stageSchemas$,
    visualizationBuilder.stageSchemas$.getValue()
  );

  return (
    <SharedTransformPanel
      transformationService={transformationService}
      stageSchemas={stageSchemas}
    />
  );
};
