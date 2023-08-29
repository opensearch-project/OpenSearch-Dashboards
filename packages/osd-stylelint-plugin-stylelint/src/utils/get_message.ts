/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

export const getUntrackedMessage = (nodeInfo: { selector: string; prop: string; value: string }) =>
  `Untracked: "${nodeInfo.selector}.${nodeInfo.prop}: ${nodeInfo.value}"`;

export const getTrackedMessage = (nodeInfo: { selector: string; prop: string; value: string }) =>
  `Tracked but missing approval: "${nodeInfo.selector}.${nodeInfo.prop}: ${nodeInfo.value}"`;

export const getNotCompliantMessage = (message: string, explanation?: string) => {
  if (explanation) {
    return `${message} ${explanation}`;
  }

  return message;
};
