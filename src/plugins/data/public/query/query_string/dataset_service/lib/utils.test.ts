/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageServiceContract } from '../..';
import { IQueryStart } from '../../..';
import { DataStructure, DATA_STRUCTURE_META_TYPES } from '../../../../../common';
import { dataPluginMock } from '../../../../mocks';
import { setQueryService } from '../../../../services';
import { injectMetaToDataStructures } from './utils';

const mockDataStructures: DataStructure[] = [
  {
    id: 'fe25e2a0-6566-11ef-bb0e-0b6b1035facb',
    title: 'mock-index-pattern-title',
    type: 'INDEX_PATTERN',
    parent: {
      id: '8f26d980-63f5-11ef-b231-09f3ad4fb0e0',
      title: 'mock-data-source-title',
      type: 'OpenSearch',
    },
    meta: { type: DATA_STRUCTURE_META_TYPES.CUSTOM },
  },
];

const dataMock = dataPluginMock.createSetupContract();
const languageServiceMock = dataMock.query.queryString.getLanguageService() as jest.Mocked<
  LanguageServiceContract
>;
setQueryService({ queryString: dataMock.query.queryString } as IQueryStart);

languageServiceMock.getQueryEditorExtensionMap.mockReturnValue({
  'mock-extension-1': {
    id: 'mock-extension-1',
    order: 1,
    isEnabled$: jest.fn(),
    getDataStructureMeta: (dataSourceId) =>
      Promise.resolve({
        type: DATA_STRUCTURE_META_TYPES.FEATURE,
        icon: { type: 'icon1' },
      }),
  },
  'mock-extension-2': {
    id: 'mock-extension-2',
    order: 2,
    isEnabled$: jest.fn(),
    getDataStructureMeta: (dataSourceId) =>
      Promise.resolve({
        type: DATA_STRUCTURE_META_TYPES.FEATURE,
        icon: { type: 'icon2' },
        tooltip: 'mock-extension-2',
      }),
  },
});

describe('Utils injectMetaToDataStructures', () => {
  it('should inject meta', async () => {
    const dataStructures = await injectMetaToDataStructures(mockDataStructures);
    expect(dataStructures[0].meta).toMatchInlineSnapshot(`
      Object {
        "icon": Object {
          "type": "icon1",
        },
        "tooltip": "mock-extension-2",
        "type": "CUSTOM",
      }
    `);
  });

  it('does not change meta if not available', async () => {
    languageServiceMock.getQueryEditorExtensionMap.mockReturnValue({
      'mock-extension-3': {
        id: 'mock-extension-3',
        order: 3,
        isEnabled$: jest.fn(),
      },
    });
    const dataStructures = await injectMetaToDataStructures(mockDataStructures);
    expect(dataStructures[0].meta).toBe(mockDataStructures[0].meta);
  });
});
