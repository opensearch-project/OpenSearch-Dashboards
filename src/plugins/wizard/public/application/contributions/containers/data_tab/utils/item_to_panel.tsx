/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ItemTypes } from '../../../constants';
import {
  Title,
  Dropbox,
  FormField,
  MainItemContribution,
  SecondaryItemContribution,
} from '../items';

export const mapItemToPanelComponents = (
  items: Array<MainItemContribution | SecondaryItemContribution>,
  isSecondary = false
) => {
  const uniqueDict: { [key: string]: boolean } = {};

  const [title, ...panelComponents] = items
    .filter((item) => {
      // Ensure unique item ID
      const id = item.type !== ItemTypes.TITLE ? item.id : 'title';
      if (uniqueDict[id]) return false;

      uniqueDict[id] = true;
      return true;
    })
    .sort((itemA, itemB) =>
      // Ensure that the title is on top
      itemA.type === ItemTypes.TITLE ? -1 : itemB.type === ItemTypes.TITLE ? 1 : 0
    )
    .map((item, index) => {
      const { type } = item;

      switch (type) {
        case ItemTypes.TITLE:
          return <Title key={index} {...item} isSecondary={isSecondary} />;

        case ItemTypes.DROPBOX:
          return <Dropbox key={item.id} {...item} />;

        case ItemTypes.SELECT:
        case ItemTypes.INPUT:
          return <FormField key={item.id} {...item} />;

        default:
          break;
      }
    });

  return (
    <>
      {title}
      <div className="wizConfig__content">{panelComponents}</div>
    </>
  );
};
