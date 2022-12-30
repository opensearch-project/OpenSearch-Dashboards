/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerTypes } from '../../../common';
import { VisLayerExpressionFn, ISavedAugmentVis } from '../../types';

const id = 'test-id';
const pluginResourceId = 'test-plugin-resource-id';
const visLayerExpressionFn = {
  type: VisLayerTypes.PointInTimeEvents,
  name: 'test-fn',
  args: {
    testArg: 'test-value',
  },
};
const visName = 'visualization_0';
const visId = 'test-vis-id';
const version = 1;

export const generateAugmentVisSavedObject = (idArg?: string, exprFnArg?: VisLayerExpressionFn) => {
  return {
    testId: idArg ? idArg : id,
    pluginResourceId,
    visLayerExpressionFn: exprFnArg ? exprFnArg : visLayerExpressionFn,
    visName,
    visId,
    version,
  } as ISavedAugmentVis;
};

export const getMockAugmentVisSavedObjectClient = (
  augmentVisSavedObjs?: ISavedAugmentVis[]
): any => {
  const savedObjs = augmentVisSavedObjs ? augmentVisSavedObjs : ([] as ISavedAugmentVis[]);

  const client = {
    findAll: jest.fn(() =>
      Promise.resolve({
        hits: savedObjs,
      })
    ),
    find: jest.fn(() =>
      Promise.resolve({
        total: savedObjs.length,
        savedObjects: savedObjs.map((savedObj) => {
          const objVisId = savedObj.visId;
          delete savedObj.visId;
          return {
            ...savedObj,
            references: [
              {
                name: savedObj.visName,
                type: 'visualization',
                id: objVisId,
              },
            ],
          };
        }),
      })
    ),
  } as any;
  return client;
};
