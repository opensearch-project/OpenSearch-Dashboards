/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useObservable } from 'react-use';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

import { Page } from '../services';
import { SectionRender } from './section_render';
import { EmbeddableStart } from '../../../embeddable/public';

export interface Props {
  page: Page;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
}

export const PageRender = ({ page, embeddable, savedObjectsClient }: Props) => {
  const sections = useObservable(page.getSections$()) || [];

  return (
    <div className="contentManagement-page" style={{ margin: '10px 20px' }}>
      {sections.map((section) => (
        <SectionRender
          key={section.id}
          embeddable={embeddable}
          section={section}
          savedObjectsClient={savedObjectsClient}
          contents$={page.getContents$(section.id)}
        />
      ))}
    </div>
  );
};
