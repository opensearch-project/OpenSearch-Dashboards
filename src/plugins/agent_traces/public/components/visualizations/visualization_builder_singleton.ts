/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationBuilder } from '../../../../explore/public';
import { getServices } from '../../services/services';

let visualizationBuilder: VisualizationBuilder;

export const getVisualizationBuilder = () => {
  if (!visualizationBuilder) {
    visualizationBuilder = new VisualizationBuilder({
      getUrlStateStorage: () => getServices().osdUrlStateStorage,
      // @ts-expect-error TS2353 TODO(ts-error): fixme
      getExpressions: () => getServices().expressions,
    });
  }
  return visualizationBuilder;
};
