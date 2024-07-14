/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useObservable } from 'react-use';

import { Page } from '../services';
import { SectionRender } from './section_render';
import { EmbeddableStart } from '../../../embeddable/public';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

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
          embeddable={embeddable}
          section={section}
          savedObjectsClient={savedObjectsClient}
          contents$={page.getContents$(section.id)}
        />
      ))}
    </div>
  );
};
