/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const RIGHT_SIDEBAR_SCROLL_KEY = 'data-right-sidebar-scroll';

export enum RightSidebarScrollField {
  Name = 'name',
  Description = 'description',
  Color = 'color',
  UseCase = 'useCase',
  DataSource = 'dataSource',
  Collaborators = 'collaborators',
  PrivacyType = 'privacyType',
}

export const generateRightSidebarScrollProps = (key: RightSidebarScrollField) => {
  return { [RIGHT_SIDEBAR_SCROLL_KEY]: key };
};
