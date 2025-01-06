/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const NAMESPACE = 'osd';

function getNamespacedCommandName(commandName) {
  return `${NAMESPACE}:${commandName}`;
}

export function addOSDUtil(commandName, callback) {
  Cypress.Commands.add(getNamespacedCommandName(commandName), callback);
}

export function createOSDUtils(cy) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        return cy[getNamespacedCommandName(prop)];
      },
    }
  );
}
