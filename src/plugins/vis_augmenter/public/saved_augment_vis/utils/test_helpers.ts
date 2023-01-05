/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { VisLayerExpressionFn, ISavedAugmentVis } from '../../types';

const pluginResourceId = 'test-plugin-resource-id';
const visName = 'visualization_0';
const visId = 'test-vis-id';
const version = 1;

export const generateAugmentVisSavedObject = (idArg: string, exprFnArg: VisLayerExpressionFn) => {
  return {
    id: idArg,
    pluginResourceId,
    visLayerExpressionFn: exprFnArg,
    visName,
    visId,
    version,
  } as ISavedAugmentVis;
};

export const getMockAugmentVisSavedObjectClient = (
  augmentVisSavedObjs: ISavedAugmentVis[],
  keepReferences: boolean = true
): any => {
  const savedObjs = (augmentVisSavedObjs = cloneDeep(augmentVisSavedObjs));

  const client = {
    find: jest.fn(() =>
      Promise.resolve({
        total: savedObjs.length,
        savedObjects: savedObjs.map((savedObj) => {
          const objVisId = savedObj.visId;
          const objId = savedObj.id;
          delete savedObj.visId;
          delete savedObj.id;
          return {
            id: objId,
            attributes: savedObj as Record<string, any>,
            references: keepReferences
              ? [
                  {
                    name: savedObj.visName,
                    type: 'visualization',
                    id: objVisId,
                  },
                ]
              : [],
          };
        }),
      })
    ),
  } as any;
  return client;
};
