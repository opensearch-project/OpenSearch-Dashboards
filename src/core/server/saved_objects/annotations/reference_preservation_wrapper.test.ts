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
  it('keeps persisted annotation references on update', async () => {
    const client = savedObjectsClientMock.create();
    client.get.mockResolvedValue({
      id: 'dashboard-1',
      type: 'dashboard',
      attributes: {},
      references: [
        { name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' },
        { name: 'panel_0', type: 'visualization', id: 'old-vis' },
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

    expect(client.get).not.toHaveBeenCalled();
    expect(client.update).toHaveBeenCalledWith(
      'dashboard',
      'dashboard-1',
      { title: 'Updated' },
      {}
    );
  });

  it('keeps persisted annotation references on bulk update', async () => {
    const client = savedObjectsClientMock.create();
    client.get.mockResolvedValue({
      id: 'dashboard-1',
      type: 'dashboard',
      attributes: {},
      references: [{ name: 'annotation_0', type: SAVED_OBJECT_ANNOTATION_TYPE, id: 'tag-1' }],
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
    ]);

    expect(client.get).toHaveBeenCalledTimes(1);
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
      ],
      {}
    );
  });
});
