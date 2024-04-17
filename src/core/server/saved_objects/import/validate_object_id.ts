/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * When enable multiple data source, exported objects from a data source will maintain object id like
 * "69a34b00-9ee8-11e7-8711-e7a007dcef99_7cbd2350-2223-11e8-b802-5bcf64c2cfb4"
 * two UUIDs are connected with a underscore,
 * before the underscore, the UUID represents the data source
 * after the underscore, the UUID is the original object id
 * when disable multiple data source, the exported object from local cluster will look like 7cbd2350-2223-11e8-b802-5bcf64c2cfb4
 * we can use this format to tell out whether a single object is exported from MDS enabled/disabled cluster
 *
 * This file to going to group some validate function to tell source of object based on the object id
 */

/**
 *
 * @param candidate: string without underscore
 * @returns
 */
const isUUID = (candidate: string): boolean => {
  // Regular expression pattern for UUID
  const uuidPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(candidate);
};

/**
 *
 * @param id single object id
 * @returns
 */
export const isSavedObjectWithDataSource = (id: string): boolean => {
  const idParts = id.split('_');
  /**
   * check with the
   */
  return idParts && idParts.length === 2 && idParts.every(isUUID);
};
