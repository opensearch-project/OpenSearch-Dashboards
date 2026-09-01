/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SAVED_OBJECT_ANNOTATION_TYPE } from '../../../types';
import { savedObjectsClientMock } from '../service/saved_objects_client.mock';
import { SavedObjectsErrorHelpers } from '../service/lib/errors';
import { SavedObjectAnnotationTypeRegistry } from './registry';
import { SavedObjectAnnotationServiceImpl } from './service';

const tag = {
  id: 'tag-1',
  type: SAVED_OBJECT_ANNOTATION_TYPE,
  attributes: {
    type: 'tag',
    name: 'Production',
    payload: '{"color":"#54B399"}',
  },
  references: [],
};

const dashboard = {
  id: 'dashboard-1',
  type: 'dashboard',
  attributes: { title: 'Dashboard' },
  references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
};

describe('SavedObjectAnnotationServiceImpl', () => {
  const registry = new SavedObjectAnnotationTypeRegistry();
  registry.register({
    type: 'tag',
    supportedObjectTypes: ['dashboard', 'visualization'],
    uniqueName: true,
  });

  let client: ReturnType<typeof savedObjectsClientMock.create>;
  let mutationClient: ReturnType<typeof savedObjectsClientMock.create>;
  let service: SavedObjectAnnotationServiceImpl;

  beforeEach(() => {
    client = savedObjectsClientMock.create();
    mutationClient = savedObjectsClientMock.create();
    client.find.mockResolvedValue({
      saved_objects: [],
      total: 0,
      page: 1,
      per_page: 1000,
    });
    service = new SavedObjectAnnotationServiceImpl(client, mutationClient, registry);
  });

  it('creates and deserializes an annotation definition', async () => {
    client.create.mockResolvedValue(tag);

    await expect(
      service.createAnnotation({
        type: 'tag',
        name: 'Production',
        payload: { color: '#54B399' },
      })
    ).resolves.toEqual({
      id: 'tag-1',
      type: 'tag',
      name: 'Production',
      payload: { color: '#54B399' },
    });
    expect(client.create).toHaveBeenCalledWith(SAVED_OBJECT_ANNOTATION_TYPE, {
      type: 'tag',
      name: 'Production',
      payload: '{"color":"#54B399"}',
    });
  });

  it('rejects a duplicate annotation name ignoring case and surrounding whitespace', async () => {
    client.find.mockResolvedValue({
      saved_objects: [{ ...tag, score: 1 }],
      total: 1,
      page: 1,
      per_page: 1000,
    });

    await expect(
      service.createAnnotation({
        type: 'tag',
        name: ' production ',
      })
    ).rejects.toThrow("An annotation of type 'tag' named 'production' already exists");
    expect(client.create).not.toHaveBeenCalled();
  });

  it('rejects renaming an annotation to an existing name', async () => {
    client.get.mockResolvedValue(tag);
    client.find.mockResolvedValue({
      saved_objects: [
        {
          ...tag,
          id: 'tag-2',
          attributes: { type: 'tag', name: 'Executive' },
          score: 1,
        },
      ],
      total: 1,
      page: 1,
      per_page: 1000,
    });

    await expect(
      service.updateAnnotation({
        annotationId: 'tag-1',
        type: 'tag',
        name: ' executive ',
      })
    ).rejects.toThrow("An annotation of type 'tag' named 'executive' already exists");
    expect(client.update).not.toHaveBeenCalled();
  });

  it('allows an annotation to retain its own normalized name', async () => {
    client.get.mockResolvedValue(tag);
    client.find.mockResolvedValue({
      saved_objects: [{ ...tag, score: 1 }],
      total: 1,
      page: 1,
      per_page: 1000,
    });
    client.update.mockResolvedValue({
      ...tag,
      attributes: {
        ...tag.attributes,
        name: ' production ',
      },
    });

    await expect(
      service.updateAnnotation({
        annotationId: 'tag-1',
        type: 'tag',
        name: ' production ',
      })
    ).resolves.toEqual({
      id: 'tag-1',
      type: 'tag',
      name: ' production ',
      payload: { color: '#54B399' },
    });
  });

  it('attaches an annotation without replacing other references', async () => {
    client.get.mockResolvedValue(tag);
    mutationClient.get.mockResolvedValue(dashboard);
    mutationClient.update.mockResolvedValue({} as any);

    await service.addAnnotationToObject({
      type: 'tag',
      annotationId: 'tag-1',
      target: { objectType: 'dashboard', objectId: 'dashboard-1' },
    });

    expect(mutationClient.update).toHaveBeenCalledWith(
      'dashboard',
      'dashboard-1',
      {},
      {
        references: [
          ...dashboard.references,
          {
            name: 'annotation_0',
            type: SAVED_OBJECT_ANNOTATION_TYPE,
            id: 'tag-1',
          },
        ],
      }
    );
  });

  it('removes an unresolved annotation reference', async () => {
    client.get.mockRejectedValue(
      SavedObjectsErrorHelpers.createGenericNotFoundError(
        SAVED_OBJECT_ANNOTATION_TYPE,
        'missing-tag'
      )
    );
    mutationClient.get.mockResolvedValue({
      ...dashboard,
      references: [
        ...dashboard.references,
        { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'missing-tag' },
      ],
    });
    mutationClient.update.mockResolvedValue({} as any);

    await service.removeAnnotationFromObject({
      type: 'tag',
      annotationId: 'missing-tag',
      target: { objectType: 'dashboard', objectId: 'dashboard-1' },
    });

    expect(client.get).toHaveBeenCalledWith(SAVED_OBJECT_ANNOTATION_TYPE, 'missing-tag');
    expect(mutationClient.update).toHaveBeenCalledWith(
      'dashboard',
      'dashboard-1',
      {},
      { references: dashboard.references }
    );
  });

  it('rejects removal when the stored annotation type does not match', async () => {
    client.get.mockResolvedValue({
      ...tag,
      attributes: {
        ...tag.attributes,
        type: 'note',
      },
    });

    await expect(
      service.removeAnnotationFromObject({
        type: 'tag',
        annotationId: 'tag-1',
        target: { objectType: 'dashboard', objectId: 'dashboard-1' },
      })
    ).rejects.toThrow("Annotation 'tag-1' is not of type 'tag'");
    expect(mutationClient.get).not.toHaveBeenCalled();
  });

  it('returns resolved annotations in target reference order', async () => {
    client.get.mockResolvedValue({
      ...dashboard,
      references: [
        { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' },
        { name: 'annotation_1', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
      ],
    });
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        tag,
        {
          ...tag,
          id: 'tag-2',
          attributes: { type: 'tag', name: 'Executive' },
        },
      ],
    });

    await expect(
      service.getAnnotationsForObject({
        type: 'tag',
        target: { objectType: 'dashboard', objectId: 'dashboard-1' },
      })
    ).resolves.toEqual([
      { id: 'tag-2', type: 'tag', name: 'Executive' },
      {
        id: 'tag-1',
        type: 'tag',
        name: 'Production',
        payload: { color: '#54B399' },
      },
    ]);
  });

  it('cleans target references before deleting a definition', async () => {
    client.get.mockResolvedValue(tag);
    client.find.mockResolvedValue({
      saved_objects: [
        {
          ...dashboard,
          references: [
            ...dashboard.references,
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
          ],
          score: 1,
        },
      ],
      total: 1,
      page: 1,
      per_page: 1000,
    });
    mutationClient.bulkUpdate.mockResolvedValue({
      saved_objects: [],
    });
    client.delete.mockResolvedValue({});

    await service.deleteAnnotation({ type: 'tag', annotationId: 'tag-1' });

    expect(mutationClient.bulkUpdate).toHaveBeenCalledWith([
      {
        type: 'dashboard',
        id: 'dashboard-1',
        attributes: {},
        references: dashboard.references,
      },
    ]);
    expect(client.delete).toHaveBeenCalledWith(SAVED_OBJECT_ANNOTATION_TYPE, 'tag-1');
  });
});
