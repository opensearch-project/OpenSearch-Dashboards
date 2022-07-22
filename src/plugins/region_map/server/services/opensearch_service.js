/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default class OpensearchService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  getMappings = async (context, req, res) => {
    try {
      const { index } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const mappings = await callAsCurrentUser('indices.getMapping', { index });
      return res.ok({
        body: {
          ok: true,
          resp: mappings,
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

  search = async (context, req, res) => {
    try {
      const { query, index, size } = req.body;
      const params = { index, size, body: query };
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const results = await callAsCurrentUser('search', params);
      return res.ok({
        body: {
          ok: true,
          resp: results,
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

  getIndex = async (context, req, res) => {
    try {
      const { index } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
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
}
