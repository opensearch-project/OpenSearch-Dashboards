/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { migrateDataSource } from './data_source';
import { savedObjectsServiceMock } from '../../../../core/server/mocks';

const contextMock = savedObjectsServiceMock.createMigrationContext();

describe('migrateDataSource Function', () => {
  it('should return the input document unchanged', () => {
    const mockDoc = {
      id: 'test-id',
      type: 'test-type',
      attributes: {
        name: 'Test Name',
        description: 'Test Description',
      },
      references: [],
    };

    // Call the migrateDataSource function with the mock document
    const result = migrateDataSource(mockDoc, contextMock);

    // Expect the result to be deeply equal to the mock document
    expect(result).toEqual(mockDoc);
  });
});
