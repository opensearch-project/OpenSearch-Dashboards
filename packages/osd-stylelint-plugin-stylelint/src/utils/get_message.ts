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

/**
 * Generates a message for untracked node information.
 * @param nodeInfo - Information about the node (selector, prop, value).
 * @returns The untracked message.
 */
export const getUntrackedMessage = (nodeInfo: { selector: string; prop: string; value: string }) =>
  `Untracked: "${nodeInfo.selector}.${nodeInfo.prop}: ${nodeInfo.value}"`;

/**
 * Generates a message for tracked node information missing approval.
 * @param nodeInfo - Information about the node (selector, prop, value).
 * @returns The tracked but missing approval message.
 */
export const getTrackedMessage = (nodeInfo: { selector: string; prop: string; value: string }) =>
  `Tracked but missing approval: "${nodeInfo.selector}.${nodeInfo.prop}: ${nodeInfo.value}"`;

/**
 * Generates a not compliant message with an optional explanation.
 * @param message - The base not compliant message.
 * @param explanation - Optional explanation for the not compliant message.
 * @returns The not compliant message with or without an explanation.
 */
export const getNotCompliantMessage = (message: string, explanation?: string) => {
  if (explanation) {
    return `${message} ${explanation}`;
  }

  return message;
};
