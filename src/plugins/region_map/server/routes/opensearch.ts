/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

// eslint-disable-next-line import/no-default-export
export default function (services, router) {
  router.post(
    {
      path: '/api/geospatial/_indices',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    services.getIndex
  );

  router.post(
    {
      path: '/api/geospatial/_search',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    services.search
  );

  router.post(
    {
      path: '/api/geospatial/_mappings',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    services.getMappings
  );
}
