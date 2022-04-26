/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default class OpensearchService {
  constructor(driver) {
    this.driver = driver;
  }

  getIndex = async (context, req, res) => {
    try {
      const { index } = req.body;
      const { callAsCurrentUser } = this.driver.asScoped(req);
      const indices = await callAsCurrentUser('cat.indices', {
        index,
        format: 'json',
        h: 'health,index,status',
      });
      return res.ok({
        body: {
          ok: true,
          resp: indices,
        },
      });
    } catch (err) {
      // Opensearch throws an index_not_found_exception which we'll treat as a success
      if (err.statusCode === 404) {
        return res.ok({
          body: {
            ok: false,
            resp: [],
          },
        });
      } else {
        return res.ok({
          body: {
            ok: false,
            resp: err.message,
          },
        });
      }
    }
  };

  getPlugins = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = this.driver.asScoped(req);
      const plugins = await callAsCurrentUser('cat.plugins', {
        format: 'json',
      });
      return res.ok({
        body: {
          ok: true,
          resp: plugins,
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
