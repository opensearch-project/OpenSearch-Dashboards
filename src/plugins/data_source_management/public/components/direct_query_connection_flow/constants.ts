/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DIRECT_QUERY_CONNECTION_FLOWS_PATH = '/flows';
export const DIRECT_QUERY_CONNECTIONS_TAB_ID = 'manageDirectQueryDataSources';

/** Router path of a flow's create page. */
export const getDirectQueryConnectionFlowPath = (flowId: string) =>
  `${DIRECT_QUERY_CONNECTION_FLOWS_PATH}/${encodeURIComponent(flowId)}`;

/** Router path of a flow's manage page for the given saved object. */
export const getDirectQueryConnectionFlowManagePath = (flowId: string, savedObjectId: string) =>
  `${getDirectQueryConnectionFlowPath(flowId)}/manage/${encodeURIComponent(savedObjectId)}`;

/** Location that brings the user back to the Direct query connections tab of the home panel. */
export const DIRECT_QUERY_CONNECTIONS_LIST_LOCATION = {
  pathname: '/',
  state: { selectedTabId: DIRECT_QUERY_CONNECTIONS_TAB_ID },
};

const FLOW_PATH_REGEX = /^\/flows\/([^/]+)(\/.*)?$/;

/**
 * Splits a router pathname of the form `/flows/<id><subPath>` into its flow id and sub-path.
 * A bare trailing slash is normalised to the empty sub-path.
 */
export const parseDirectQueryConnectionFlowPath = (
  pathname: string
): { flowId: string; path: string } | undefined => {
  const match = FLOW_PATH_REGEX.exec(pathname);
  if (!match) {
    return undefined;
  }
  let flowId: string;
  try {
    flowId = decodeURIComponent(match[1]);
  } catch (e) {
    return undefined;
  }
  const subPath = match[2] ?? '';
  return { flowId, path: subPath === '/' ? '' : subPath };
};
