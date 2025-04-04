/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Creates a div element with the id of containerName-extensionConfigId if it doesn't exist,
 * and returns the element. If an HTML element already exists by that id, it simply returns it
 * without doing anything. If it doesn't exist, it creates a div element and does the following:
 * - gives it two classes: containerName and containerName__extensionConfigId
 * - gives it an id of containerName-extensionConfigId
 * - If the provided parentContainer exists, it appends the created element as a child to that element
 * @param props - props needed for function
 * @param props.extensionConfigId - the unique ID of the extension
 * @param props.containerName - the name you want the container to have. Will dictate the id of the element and the className.
 * @param props.parentContainer - the parent HTML element you want this element append to
 * @returns the created or retrieved HTML element
 */
export const createOrGetExtensionContainer = ({
  extensionConfigId,
  containerName,
  parentContainer,
}: {
  extensionConfigId: string;
  containerName: string;
  parentContainer: Element | null;
}) => {
  const extensionId = `${containerName}-${extensionConfigId}`;
  let extensionContainer = document.getElementById(extensionId);
  if (!extensionContainer) {
    extensionContainer = document.createElement('div');
    extensionContainer.className = `${containerName} ${containerName}__${extensionConfigId}`;
    extensionContainer.id = extensionId;
    parentContainer?.appendChild(extensionContainer);
  }
  return extensionContainer;
};
