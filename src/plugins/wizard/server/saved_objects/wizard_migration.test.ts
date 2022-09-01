/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectMigrationFn, SavedObjectMigrationContext } from '../../../../core/server';
import { wizardSavedObjectTypeMigrations } from './wizard_migration';

const savedObjectMigrationContext = (null as unknown) as SavedObjectMigrationContext;

describe('3.0.0', () => {
  const migrate = (doc: any) =>
    wizardSavedObjectTypeMigrations['3.0.0'](
      doc as Parameters<SavedObjectMigrationFn>[0],
      savedObjectMigrationContext
    );

  it('should return original doc if visualizationState is not found', () => {
    const migratedDoc = migrate({
      type: 'wizard',
      attributes: {},
    });

    expect(migratedDoc).toEqual({
      type: 'wizard',
      attributes: {},
    });
  });

  it('should return original doc if indexPattern is not found within visualizationState', () => {
    const migratedDoc = migrate({
      type: 'wizard',
      attributes: {
        visualizationState: {
          searchSource: '',
          activeVisualization: {},
        },
      },
    });

    expect(migratedDoc).toEqual({
      type: 'wizard',
      attributes: {
        visualizationState: {
          searchSource: '',
          activeVisualization: {},
        },
      },
    });
  });

  it('should return original doc if references is not an array', () => {
    const migratedDoc = migrate({
      type: 'wizard',
      attributes: {
        visualizationState: {},
      },
      references: {},
    });

    expect(migratedDoc).toEqual({
      type: 'wizard',
      attributes: {
        visualizationState: {},
      },
      references: {},
    });
  });

  it('should migrate the old version wizard saved object to new version wizard saved object', () => {
    const migratedDoc = migrate({
      type: 'wizard',
      attributes: {
        visualizationState: JSON.stringify({
          searchFields: {},
          activeVisualization: {},
          indexPattern: 'indexPatternId',
        }),
      },
      references: [],
    });

    expect(migratedDoc).toEqual({
      type: 'wizard',
      attributes: {
        visualizationState: JSON.stringify({
          searchFields: {},
          activeVisualization: {},
        }),
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          }),
        },
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: 'indexPatternId',
        },
      ],
    });
  });
});
