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

import { httpServiceMock } from '../http/http_service.mock';
import { SavedObjectAnnotationClient } from './saved_object_annotation_client';

describe('SavedObjectAnnotationClient', () => {
  it('uses the internal annotation transport', async () => {
    const http = httpServiceMock.createStartContract();
    http.fetch.mockResolvedValue([]);
    const client = new SavedObjectAnnotationClient(http);

    await client.findAnnotations({ type: 'tag' });

    expect(http.fetch).toHaveBeenCalledWith('/internal/saved_object_annotations/_find', {
      method: 'POST',
      body: JSON.stringify({ type: 'tag' }),
    });
  });

  it('encodes annotation IDs when deleting', async () => {
    const http = httpServiceMock.createStartContract();
    const client = new SavedObjectAnnotationClient(http);

    await client.deleteAnnotation({ type: 'tag', annotationId: 'tag/1' });

    expect(http.fetch).toHaveBeenCalledWith('/internal/saved_object_annotations/tag%2F1', {
      method: 'DELETE',
      query: { type: 'tag' },
    });
  });

  it('replaces object annotations through the set transport', async () => {
    const http = httpServiceMock.createStartContract();
    const client = new SavedObjectAnnotationClient(http);
    const input = {
      annotationIds: ['tag-1', 'tag-2'],
      type: 'tag',
      target: {
        objectType: 'dashboard',
        objectId: 'dashboard-1',
      },
    };

    await client.setAnnotationsForObject(input);

    expect(http.fetch).toHaveBeenCalledWith('/internal/saved_object_annotations/_set_for_object', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  });
});
