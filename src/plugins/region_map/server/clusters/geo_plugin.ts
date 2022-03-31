/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UPLOAD_GEOJSON_API } from '../../common/constants/shared';

// eslint-disable-next-line import/no-default-export
export default function GeoPlugin(Client, config, components) {
  const ca = components.clientAction.factory;
  Client.prototype.geo = components.clientAction.namespaceFactory();
  const geo = Client.prototype.geo.prototype;

  geo.geoQuery = ca({
    url: {
      fmt: `${UPLOAD_GEOJSON_API}`,
    },
    method: 'POST',
  });
}
