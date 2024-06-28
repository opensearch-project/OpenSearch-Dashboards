import React from 'react';
import { useObservable } from 'react-use';

import { Page } from '../services';
import { SectionRender } from './section_render';
import { EmbeddableStart } from '../../../embeddable/public';

export interface Props {
  page: Page;
  embeddable: EmbeddableStart;
}

export const PageRender = ({ page, embeddable }: Props) => {
  console.log('page: ', page);

  const sections = useObservable(page.getSections$()) || [];
  console.log('sections: ', sections);

  return (
    <div className="contentManagement-page" style={{ margin: '10px 20px' }}>
      {sections.map((section) => (
        <SectionRender
          embeddable={embeddable}
          section={section}
          contents$={page.getContents$(section.id)}
        />
      ))}
    </div>
  );
};
