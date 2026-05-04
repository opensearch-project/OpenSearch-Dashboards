/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONTAINER_URL_KEY = '_c';
export const QUERY_EDITOR_STATE_KEY = '_e';
export const QUERY_BUILDER_QUERY_STATE_KEY = '_eq';
export const VARIABLE_VALUES_URL_KEY = '_va';

export interface ContainerState {
  originatingApp: string | undefined;
  containerInfo: ContainerInfo | undefined;
}

export interface ContainerInfo {
  containerName: string;
  containerId: string;
}
