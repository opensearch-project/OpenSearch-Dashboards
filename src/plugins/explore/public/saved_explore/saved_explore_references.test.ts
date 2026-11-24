/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { SavedObjectNotFound } from '../../../opensearch_dashboards_utils/public';
import { serializeSavedObject } from '../../../saved_objects/public/saved_object/helpers/serialize_saved_object';
import { applyOpenSearchResp } from '../../../saved_objects/public/saved_object/helpers/apply_opensearch_resp';
import { createSearchSource as createSearchSourceFactory } from '../../../data/common/search/search_source/create_search_source';
import { SearchSourceDependencies } from '../../../data/common/search/search_source/search_source';
// The import validation of saved objects, to check what an exported search needs on import.
import { validateReferences } from '../../../../core/server/saved_objects/import/validate_references';
import { SAVED_OBJECT_TYPE } from './_saved_explore';
import { inlineDatasetReferences } from './inline_dataset_references';

/**
 * A saved Explore search through its whole life: saved (references extracted), exported, checked on
 * import, and loaded again. Covers an index pattern, a dataset type whose datasets have no saved
 * object (`meta.noSavedObject`), and a type without the flag, such as a saved dataset of the
 * dataset service.
 */
describe('saved explore references', () => {
  const INDEX_REF_NAME = 'kibanaSavedObjectMeta.searchSourceJSON.index';
  const typeConfigs: Record<string, { meta: { noSavedObject?: boolean } }> = {
    LOGS_SOURCE: { meta: { noSavedObject: true } },
    SAVED_SOURCE: { meta: {} },
  };
  const config = {
    type: SAVED_OBJECT_TYPE,
    searchSource: true,
    mapping: { title: 'text', columns: 'keyword', visualization: 'text', uiState: 'text' },
    extractReferences: inlineDatasetReferences((type) => typeConfigs[type]),
  };

  const indexPattern = { id: 'logs-pattern-id', title: 'logs-*', timeFieldName: 'timestamp' };
  const otherIndexPattern = { id: 'other-pattern-id', title: 'other-*', timeFieldName: 'ts' };
  const logsSourceId = 'logs-source::us-west-2::/app/orders';
  // What the dataset service caches for a dataset with no saved object behind it.
  const logsSourceView = { id: logsSourceId, title: '/app/orders', type: 'LOGS_SOURCE' };
  // A saved dataset of a type without the flag, with an id of the older `<dataSource>::<uuid>`
  // shape (DatasetService.saveDataset before it used `_`).
  const savedSourceId = 'data-source-id::6f1c2a9e-1b2c-4d5e-8f90-123456789abc';
  const savedSourceView = { id: savedSourceId, title: 'orders', type: 'SAVED_SOURCE' };

  const datasetOf = (view: { id: string; title: string; type?: string }) => ({
    id: view.id,
    title: view.title,
    type: view.type ?? 'INDEX_PATTERN',
  });

  const savedIndexPatterns: Record<string, unknown> = {
    [indexPattern.id]: indexPattern,
    [otherIndexPattern.id]: otherIndexPattern,
  };
  const indexPatterns = {
    get: jest.fn(async (id: string, onlyCheckCache?: boolean) => {
      if (onlyCheckCache) {
        if (id === logsSourceId) return logsSourceView;
        if (id === savedSourceId) return savedSourceView;
        return savedIndexPatterns[id];
      }
      if (savedIndexPatterns[id]) return savedIndexPatterns[id];
      throw new SavedObjectNotFound('index-pattern', id);
    }),
  };
  const dependencies: SearchSourceDependencies = {
    getConfig: jest.fn(),
    search: jest.fn(),
    onResponse: (req, res) => res,
    legacy: { callMsearch: jest.fn(), loadingCount$: new BehaviorSubject(0) },
    df: { get: jest.fn().mockReturnValue({}), set: jest.fn(), clear: jest.fn() },
  };
  const createSearchSource = createSearchSourceFactory(indexPatterns as any, dependencies);

  const searchSourceFieldsOn = (view: { id: string; title: string; type?: string }) => ({
    index: view,
    query: { query: 'source = x | head 10', language: 'PPL', dataset: datasetOf(view) },
    filter: [],
  });

  /** Saves the object the way `saveSavedObject` does and returns what gets stored and exported. */
  const save = (savedObject: Record<string, any>) => {
    const { attributes, references } = config.extractReferences(
      serializeSavedObject(savedObject as any, config as any) as any
    );
    return {
      id: 'saved-explore-id',
      type: SAVED_OBJECT_TYPE,
      attributes: attributes as Record<string, any>,
      references,
    };
  };

  /** Checks a stored object as the saved objects import does, with the given objects existing. */
  const importErrors = async (stored: ReturnType<typeof save>, existing: string[]) => {
    const savedObjectsClient = {
      bulkGet: jest.fn(async (objects: Array<{ type: string; id: string }>) => ({
        saved_objects: objects.map(({ type, id }) =>
          existing.includes(`${type}:${id}`)
            ? { type, id, attributes: {}, references: [] }
            : { type, id, error: { statusCode: 404, message: 'Not found' } }
        ),
      })),
    };
    return validateReferences([stored as any], savedObjectsClient as any);
  };

  /** Loads a stored object the way the saved object loader does. */
  const load = async (stored: ReturnType<typeof save>) => {
    const savedObject: Record<string, any> = { id: stored.id, defaults: {} };
    await applyOpenSearchResp(
      { _id: stored.id, _source: { ...stored.attributes }, references: stored.references },
      savedObject as any,
      config as any,
      { search: { searchSource: { create: createSearchSource } } } as any
    );
    return savedObject;
  };

  test('an index pattern dataset is saved as an index-pattern reference and loads back', async () => {
    const stored = save({ title: 'Logs', searchSourceFields: searchSourceFieldsOn(indexPattern) });

    expect(stored.references).toEqual([
      { name: INDEX_REF_NAME, type: 'index-pattern', id: indexPattern.id },
    ]);
    expect(await importErrors(stored, [`index-pattern:${indexPattern.id}`])).toEqual([]);
    // Importing without the index pattern still asks for one, as before.
    expect(await importErrors(stored, [])).toEqual([
      expect.objectContaining({
        error: {
          type: 'missing_references',
          references: [{ type: 'index-pattern', id: indexPattern.id }],
        },
      }),
    ]);

    const loaded = await load(stored);
    expect(loaded.searchSource.getField('index')).toBe(indexPattern);
  });

  test('a dataset that is not an index pattern needs no reference to import and loads back', async () => {
    const stored = save({
      title: 'Orders',
      searchSourceFields: searchSourceFieldsOn(logsSourceView),
    });

    expect(stored.references).toEqual([]);
    expect(JSON.parse(stored.attributes.kibanaSavedObjectMeta.searchSourceJSON).index).toBe(
      logsSourceId
    );
    expect(await importErrors(stored, [])).toEqual([]);

    const loaded = await load(stored);
    expect(loaded.searchSource.getField('index')).toBe(logsSourceView);
    expect(loaded.searchSource.getField('query').dataset.id).toBe(logsSourceId);
  });

  test('a filter on a dataset with no saved object stays inline too', async () => {
    const fields = searchSourceFieldsOn(logsSourceView);
    const stored = save({
      title: 'Orders',
      searchSourceFields: {
        ...fields,
        filter: [{ meta: { index: logsSourceId, key: 'level' }, query: {} }],
      },
    });

    expect(stored.references).toEqual([]);
    const json = JSON.parse(stored.attributes.kibanaSavedObjectMeta.searchSourceJSON);
    expect(json.filter[0].meta).toEqual({ index: logsSourceId, key: 'level' });
    expect(await importErrors(stored, [])).toEqual([]);
  });

  test('a re-saved search on a dataset with no saved object carries no reference', async () => {
    const loaded = await load(
      save({ title: 'Orders', searchSourceFields: searchSourceFieldsOn(logsSourceView) })
    );
    // The loaded search source is serialized too (serializeSavedObject), with its own reference.
    loaded.searchSourceFields = searchSourceFieldsOn(logsSourceView);
    const resaved = save(loaded);

    expect(resaved.references).toEqual([]);
    expect(await importErrors(resaved, [])).toEqual([]);
  });

  test('a dataset of a type without the flag keeps its reference, also with a `::` id', async () => {
    const stored = save({
      title: 'Orders',
      searchSourceFields: searchSourceFieldsOn(savedSourceView),
    });

    expect(stored.references).toEqual([
      { name: INDEX_REF_NAME, type: 'index-pattern', id: savedSourceId },
    ]);
    // Export takes the saved dataset along, and import asks for it, as before.
    expect(await importErrors(stored, [`index-pattern:${savedSourceId}`])).toEqual([]);
  });

  test('a search saved before this change, with its dataset as an index-pattern reference, still loads', async () => {
    const searchSourceJSON = JSON.stringify({
      query: searchSourceFieldsOn(logsSourceView).query,
      filter: [],
      indexRefName: INDEX_REF_NAME,
    });
    const stored = {
      id: 'saved-explore-id',
      type: SAVED_OBJECT_TYPE,
      attributes: { title: 'Orders', kibanaSavedObjectMeta: { searchSourceJSON } },
      references: [{ name: INDEX_REF_NAME, type: 'index-pattern', id: logsSourceId }],
    };

    const loaded = await load(stored as any);
    expect(loaded.searchSource.getField('index')).toBe(logsSourceView);
  });
});
