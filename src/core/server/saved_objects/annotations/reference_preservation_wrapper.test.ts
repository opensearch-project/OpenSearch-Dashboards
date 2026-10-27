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

import { savedObjectsClientMock } from '../service/saved_objects_client.mock';
import { SAVED_OBJECT_ANNOTATION_TYPE } from '../../../types';
import { annotationReferencePreservationWrapper } from './reference_preservation_wrapper';

describe('annotationReferencePreservationWrapper', () => {
  it('keeps persisted annotation references on overwrite create', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: {},
          references: [
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
            { name: 'panel_0', type: 'visualization', id: 'old-vis' },
          ],
        },
      ],
    });
    client.create.mockResolvedValue({} as any);
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.create(
      'dashboard',
      { title: 'Updated' },
      {
        id: 'dashboard-1',
        overwrite: true,
        references: [{ name: 'panel_0', type: 'visualization', id: 'new-vis' }],
      }
    );

    expect(client.bulkGet).toHaveBeenCalledWith([{ type: 'dashboard', id: 'dashboard-1' }]);
    expect(client.create).toHaveBeenCalledWith(
      'dashboard',
      { title: 'Updated' },
      {
        id: 'dashboard-1',
        overwrite: true,
        references: [
          { name: 'panel_0', type: 'visualization', id: 'new-vis' },
          { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
        ],
      }
    );
  });

  it('allows overwrite create when the saved object does not exist', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          error: {
            error: 'Not Found',
            message: 'Saved object [dashboard/dashboard-1] not found',
            statusCode: 404,
          },
        } as any,
      ],
    });
    client.create.mockResolvedValue({} as any);
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });
    const references = [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }];

    await wrapper.create(
      'dashboard',
      { title: 'New dashboard' },
      {
        id: 'dashboard-1',
        overwrite: true,
        references,
      }
    );

    expect(client.bulkGet).toHaveBeenCalledWith([{ type: 'dashboard', id: 'dashboard-1' }]);
    expect(client.create).toHaveBeenCalledWith(
      'dashboard',
      { title: 'New dashboard' },
      {
        id: 'dashboard-1',
        overwrite: true,
        references,
      }
    );
  });

  it('does not read the persisted object for a non-overwrite create', async () => {
    const client = savedObjectsClientMock.create();
    client.create.mockResolvedValue({} as any);
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.create(
      'dashboard',
      { title: 'New dashboard' },
      {
        id: 'dashboard-1',
        references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
      }
    );

    expect(client.bulkGet).not.toHaveBeenCalled();
  });

  it('uses one read to keep persisted annotation references on bulk overwrite create', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: {},
          references: [{ name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' }],
        },
        {
          id: 'visualization-1',
          type: 'visualization',
          attributes: {},
          references: [{ name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' }],
        },
      ],
    });
    client.bulkCreate.mockResolvedValue({ saved_objects: [] });
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.bulkCreate(
      [
        {
          type: 'dashboard',
          id: 'dashboard-1',
          attributes: { title: 'Updated' },
          references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
        },
        {
          type: 'visualization',
          id: 'visualization-1',
          attributes: { title: 'Updated visualization' },
          references: [{ name: 'data_0', type: 'index-pattern', id: 'index-pattern-1' }],
        },
        {
          type: 'search',
          attributes: { title: 'New search' },
        },
      ],
      { overwrite: true }
    );

    expect(client.bulkGet).toHaveBeenCalledTimes(1);
    expect(client.bulkGet).toHaveBeenCalledWith([
      { type: 'dashboard', id: 'dashboard-1' },
      { type: 'visualization', id: 'visualization-1' },
    ]);
    expect(client.bulkCreate).toHaveBeenCalledWith(
      [
        {
          type: 'dashboard',
          id: 'dashboard-1',
          attributes: { title: 'Updated' },
          references: [
            { name: 'panel_0', type: 'visualization', id: 'vis-1' },
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
          ],
        },
        {
          type: 'visualization',
          id: 'visualization-1',
          attributes: { title: 'Updated visualization' },
          references: [
            { name: 'data_0', type: 'index-pattern', id: 'index-pattern-1' },
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' },
          ],
        },
        {
          type: 'search',
          attributes: { title: 'New search' },
        },
      ],
      { overwrite: true }
    );
  });

  it('keeps persisted annotation references on update', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: {},
          references: [
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
            { name: 'panel_0', type: 'visualization', id: 'old-vis' },
          ],
        },
      ],
    });
    client.update.mockResolvedValue({} as any);
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.update(
      'dashboard',
      'dashboard-1',
      { title: 'Updated' },
      {
        references: [
          { name: 'panel_0', type: 'visualization', id: 'new-vis' },
          { name: 'annotation_1', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' },
        ],
      }
    );

    expect(client.bulkGet).toHaveBeenCalledWith([{ type: 'dashboard', id: 'dashboard-1' }]);
    expect(client.update).toHaveBeenCalledWith(
      'dashboard',
      'dashboard-1',
      { title: 'Updated' },
      {
        references: [
          { name: 'panel_0', type: 'visualization', id: 'new-vis' },
          { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
        ],
      }
    );
  });

  it('does not read the persisted object when references are omitted', async () => {
    const client = savedObjectsClientMock.create();
    client.update.mockResolvedValue({} as any);
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.update('dashboard', 'dashboard-1', { title: 'Updated' });

    expect(client.bulkGet).not.toHaveBeenCalled();
    expect(client.update).toHaveBeenCalledWith(
      'dashboard',
      'dashboard-1',
      { title: 'Updated' },
      {}
    );
  });

  it('uses one read to keep persisted annotation references on bulk update', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: {},
          references: [{ name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' }],
        },
        {
          id: 'search-1',
          type: 'search',
          attributes: {},
          references: [{ name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' }],
        },
      ],
    });
    client.bulkUpdate.mockResolvedValue({ saved_objects: [] });
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    await wrapper.bulkUpdate([
      {
        type: 'dashboard',
        id: 'dashboard-1',
        attributes: { title: 'Updated' },
        references: [{ name: 'panel_0', type: 'visualization', id: 'vis-1' }],
      },
      {
        type: 'visualization',
        id: 'visualization-1',
        attributes: { title: 'Updated' },
      },
      {
        type: 'search',
        id: 'search-1',
        attributes: { title: 'Updated search' },
        references: [{ name: 'data_0', type: 'index-pattern', id: 'index-pattern-1' }],
      },
    ]);

    expect(client.bulkGet).toHaveBeenCalledTimes(1);
    expect(client.bulkGet).toHaveBeenCalledWith([
      { type: 'dashboard', id: 'dashboard-1' },
      { type: 'search', id: 'search-1' },
    ]);
    expect(client.bulkUpdate).toHaveBeenCalledWith(
      [
        {
          type: 'dashboard',
          id: 'dashboard-1',
          attributes: { title: 'Updated' },
          references: [
            { name: 'panel_0', type: 'visualization', id: 'vis-1' },
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
          ],
        },
        {
          type: 'visualization',
          id: 'visualization-1',
          attributes: { title: 'Updated' },
        },
        {
          type: 'search',
          id: 'search-1',
          attributes: { title: 'Updated search' },
          references: [
            { name: 'data_0', type: 'index-pattern', id: 'index-pattern-1' },
            { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-2' },
          ],
        },
      ],
      {}
    );
  });

  it('lets bulk update report a missing target without blocking valid updates', async () => {
    const client = savedObjectsClientMock.create();
    client.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: {},
          references: [],
        },
        {
          id: 'dashboard-2',
          type: 'dashboard',
          error: {
            error: 'Not Found',
            message: 'Saved object [dashboard/dashboard-2] not found',
            statusCode: 404,
          },
        } as any,
      ],
    });
    client.bulkUpdate.mockResolvedValue({
      saved_objects: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          attributes: { title: 'First dashboard' },
          references: [],
        },
        {
          id: 'dashboard-2',
          type: 'dashboard',
          attributes: { title: 'Second dashboard' },
          references: [],
          error: {
            error: 'Not Found',
            message: 'Saved object [dashboard/dashboard-2] not found',
            statusCode: 404,
          },
        },
      ],
    });
    const wrapper = annotationReferencePreservationWrapper({
      client,
      request: {} as any,
      typeRegistry: {} as any,
    });

    const objects = [
      {
        type: 'dashboard',
        id: 'dashboard-1',
        attributes: { title: 'First dashboard' },
        references: [],
      },
      {
        type: 'dashboard',
        id: 'dashboard-2',
        attributes: { title: 'Second dashboard' },
        references: [],
      },
    ];

    const result = await wrapper.bulkUpdate(objects);

    expect(client.bulkUpdate).toHaveBeenCalledWith(objects, {});
    expect(result.saved_objects[1].error?.statusCode).toBe(404);
  });
});
