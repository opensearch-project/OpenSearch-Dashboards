/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default class GeospatialService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  uploadGeojson = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const uploadResponse = await callAsCurrentUser('geo.geoQuery', { body: req.body });
      return res.ok({
        body: {
          ok: true,
          resp: uploadResponse,
        },
      });
    } catch (err) {
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };
}
