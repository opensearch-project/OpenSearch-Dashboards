/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Initializes a command namespace on the cy object
 *
 * Ex usage:
 *   initCommandNamespace(cy, 'osd'); // initializes osd namespace (only needed once per ns)
 *   cy.osd.add('myNewCommand', (myArg) => ...); // register command to namespace
 *   cy.osd.myNewCommand('someArg'); // executes command
 *
 */
export default function initCommandNamespace(cy, namespace) {
  /**
   * this proxy is responsible for intercepting access to properties
   * it's what allows us to dynamically define properties at runtime like cy.osd.myNewCommand
   */
  cy[namespace] = new Proxy(
    {
      // register a new namespaced command with cypress (ex. osd:myNewCommand)
      add(commandName, callback) {
        Cypress.Commands.add(namespaceCommand(commandName), callback);
      },
    },
    {
      get(target, property) {
        if (target[property]) {
          // return reserved property (add method)
          return target[property];
        }

        // return the mapped namespace command (ex. myNewCommand returns the osd:myNewCommand command)
        return cy[namespaceCommand(property)];
      },
    }
  );

  function namespaceCommand(commandName) {
    return `${namespace}:${commandName}`;
  }
}
