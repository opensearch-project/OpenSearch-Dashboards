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

import { schema } from '@osd/config-schema';
import { InternalHttpServiceSetup } from '../../http';

const payloadSchema = schema.recordOf(schema.string(), schema.any());
const targetSchema = schema.object({
  objectType: schema.string(),
  objectId: schema.string(),
});

export const registerSavedObjectAnnotationRoutes = (http: InternalHttpServiceSetup) => {
  const router = http.createRouter('/internal/saved_object_annotations');

  router.post(
    {
      path: '',
      validate: {
        body: schema.object({
          type: schema.string(),
          name: schema.string(),
          description: schema.maybe(schema.string()),
          payload: schema.maybe(payloadSchema),
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      const annotation = await context.core.savedObjects.annotations.createAnnotation(request.body);
      return response.ok({ body: annotation });
    })
  );

  router.put(
    {
      path: '/{annotationId}',
      validate: {
        params: schema.object({
          annotationId: schema.string(),
        }),
        body: schema.object({
          type: schema.string(),
          name: schema.maybe(schema.string()),
          description: schema.maybe(schema.string()),
          payload: schema.maybe(payloadSchema),
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      const annotation = await context.core.savedObjects.annotations.updateAnnotation({
        annotationId: request.params.annotationId,
        ...request.body,
      });
      return response.ok({ body: annotation });
    })
  );

  router.delete(
    {
      path: '/{annotationId}',
      validate: {
        params: schema.object({
          annotationId: schema.string(),
        }),
        query: schema.object({
          type: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      await context.core.savedObjects.annotations.deleteAnnotation({
        annotationId: request.params.annotationId,
        type: request.query.type,
      });
      return response.ok();
    })
  );

  router.post(
    {
      path: '/_find',
      validate: {
        body: schema.object({
          type: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      const annotations = await context.core.savedObjects.annotations.findAnnotations(request.body);
      return response.ok({ body: annotations });
    })
  );

  router.post(
    {
      path: '/_attach',
      validate: {
        body: schema.object({
          annotationId: schema.string(),
          type: schema.string(),
          target: targetSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      await context.core.savedObjects.annotations.addAnnotationToObject(request.body);
      return response.ok();
    })
  );

  router.post(
    {
      path: '/_detach',
      validate: {
        body: schema.object({
          annotationId: schema.string(),
          type: schema.string(),
          target: targetSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      await context.core.savedObjects.annotations.removeAnnotationFromObject(request.body);
      return response.ok();
    })
  );

  router.post(
    {
      path: '/_get_for_object',
      validate: {
        body: schema.object({
          type: schema.string(),
          target: targetSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, request, response) => {
      const annotations = await context.core.savedObjects.annotations.getAnnotationsForObject(
        request.body
      );
      return response.ok({ body: annotations });
    })
  );
};
