/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScopedHistory } from 'opensearch-dashboards/public';
import { coreMock, scopedHistoryMock } from 'opensearch-dashboards/public/mocks';
import { dataPluginMock } from '../../../../../../data/public/mocks';
import { embeddablePluginMock } from '../../../../../../embeddable/public/mocks';
import { expressionsPluginMock } from '../../../../../../expressions/public/mocks';
import { createOsdUrlStateStorage } from '../../../../../../opensearch_dashboards_utils/public';
import { DataExplorerServices } from '../types';

export const createDataExplorerServicesMock = () => {
  const coreStartMock = coreMock.createStart();
  const dataMock = dataPluginMock.createStartContract();
  const embeddableMock = embeddablePluginMock.createStartContract();
  const expressionMock = expressionsPluginMock.createStartContract();
  const osdUrlStateStorageMock = createOsdUrlStateStorage({ useHash: false });

  const dataExplorerServicesMock: DataExplorerServices = {
    ...coreStartMock,
    expressions: expressionMock,
    data: dataMock,
    osdUrlStateStorage: osdUrlStateStorageMock,
    embeddable: embeddableMock,
    scopedHistory: (scopedHistoryMock.create() as unknown) as ScopedHistory,
    viewRegistry: {
      get: jest.fn(),
      all: jest.fn(() => []),
    },
  };

  return (dataExplorerServicesMock as unknown) as jest.Mocked<DataExplorerServices>;
};
