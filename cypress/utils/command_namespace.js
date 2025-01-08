/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default function initCommandNamespace(cy, namespace) {
  cy[namespace] = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'add') {
          return (commandName, callback) => {
            Cypress.Commands.add(namespaceCommand(commandName), callback);
          };
        }
        return cy[namespaceCommand(prop)];
      },
    }
  );

  function namespaceCommand(commandName) {
    return `${namespace}:${commandName}`;
  }
}
