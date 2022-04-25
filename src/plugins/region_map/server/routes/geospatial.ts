/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { FILE_PAYLOAD_SIZE } from '../../common/constants/shared';

// eslint-disable-next-line import/no-default-export
export default function (services, router) {
  router.post(
    {
      path: '/api/geospatial/_upload',
      validate: {
        body: schema.any(),
      },
      options: {
        body: {
          accepts: 'application/json',
          maxBytes: FILE_PAYLOAD_SIZE, // 25 MB payload limit for custom geoJSON feature
        },
      },
    },
    services.uploadGeojson
  );
}
