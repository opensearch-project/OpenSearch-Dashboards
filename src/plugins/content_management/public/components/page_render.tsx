/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useObservable } from 'react-use';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

import { EuiFlexItem, EuiPage, EuiSpacer } from '@elastic/eui';
import { Page } from '../services';
import { SectionRender } from './section_render';
import { EmbeddableStart } from '../../../embeddable/public';
import { RenderOptions } from '../types';

export interface Props {
  page: Page;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
  renderOptions?: RenderOptions;
}

export const PageRender = ({ page, embeddable, savedObjectsClient, renderOptions }: Props) => {
  const sections = useObservable(page.getSections$()) || [];

  let finalRenderSections = sections;
  const { sectionId, fragmentOnly } = renderOptions || {};
  if (sectionId) {
    finalRenderSections = sections.filter((section) => section.id === sectionId);
  }

  const sectionRenderResult = (
    <>
      {finalRenderSections.map((section, i) => (
        <React.Fragment key={section.id}>
          <EuiFlexItem>
            <SectionRender
              key={section.id}
              embeddable={embeddable}
              section={section}
              savedObjectsClient={savedObjectsClient}
              contents$={page.getContents$(section.id)}
            />
          </EuiFlexItem>
          {i < sections.length - 1 && <EuiSpacer size="m" />}
        </React.Fragment>
      ))}
    </>
  );

  if (fragmentOnly) {
    return sectionRenderResult;
  }

  return (
    <EuiPage direction="column" className="contentManagement-page">
      {sectionRenderResult}
    </EuiPage>
  );
};
