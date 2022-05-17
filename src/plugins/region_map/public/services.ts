/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const postGeojson = async (requestBody: any, http: any) => {
  try {
    const response = await http.post('../api/geospatial/_upload', {
      body: requestBody,
    });
    return response;
  } catch (e) {
    return e;
  }
};

export const getIndex = async (indexName: string, http: any) => {
  try {
    const response = await http.post('../api/geospatial/_indices', {
      body: JSON.stringify({
        index: indexName,
      }),
    });
    return response;
  } catch (e) {
    return e;
  }
};

export const getPlugins = async (http: any) => {
  try {
    const response = await http.post('../api/geospatial/_plugins', {});
    return response;
  } catch (e) {
    return e;
  }
};
