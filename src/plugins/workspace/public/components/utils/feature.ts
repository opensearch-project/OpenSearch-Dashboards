/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { App } from '../../../../../core/public';

export const isFeatureDependBySelectedFeatures = (
  featureId: string,
  selectedFeatureIds: string[],
  featureDependencies: { [key: string]: string[] }
) =>
  selectedFeatureIds.some((selectedFeatureId) =>
    (featureDependencies[selectedFeatureId] || []).some((dependencies) =>
      dependencies.includes(featureId)
    )
  );

/**
 *
 * Generate new feature id list based the old feature id list
 * and feature dependencies map. The feature dependency map may
 * has duplicate ids with old feature id list. Use set here to
 * get the unique feature ids.
 *
 * @param featureIds a feature id list need to add based old feature id list
 * @param featureDependencies a feature dependencies map to get depended feature ids
 * @param oldFeatureIds a feature id list that represent current feature id selection states
 */
export const getFinalFeatureIdsByDependency = (
  featureIds: string[],
  featureDependencies: { [key: string]: string[] },
  oldFeatureIds: string[] = []
) =>
  Array.from(
    new Set([
      ...oldFeatureIds,
      ...featureIds.reduce(
        (pValue, featureId) => [...pValue, ...(featureDependencies[featureId] || [])],
        featureIds
      ),
    ])
  );

export const generateFeatureDependencyMap = (
  allFeatures: Array<Pick<App, 'id' | 'dependencies'>>
) =>
  allFeatures.reduce<{ [key: string]: string[] }>(
    (pValue, { id, dependencies }) =>
      dependencies
        ? {
            ...pValue,
            [id]: [
              ...(pValue[id] || []),
              ...Object.keys(dependencies).filter((key) => dependencies[key].type === 'required'),
            ],
          }
        : pValue,
    {}
  );
