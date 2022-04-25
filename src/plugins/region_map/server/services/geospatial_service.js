/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default class GeospatialService {
  constructor(driver) {
    this.driver = driver;
  }

  uploadGeojson = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = await this.driver.asScoped(req);
      const uploadResponse = await callAsCurrentUser('geospatial.geospatialQuery', {
        body: req.body,
      });
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
