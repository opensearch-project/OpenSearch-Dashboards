import React, { useState, useEffect } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { Content, Section } from '../services';
import { EmbeddableRenderer, EmbeddableStart } from '../../../embeddable/public';
import { DashboardContainerInput } from '../../../dashboard/public';
import { createDashboardSection } from './utils';

interface Props {
  section: Section;
  contents$: BehaviorSubject<Content[]>;
  embeddable: EmbeddableStart;
}

export const SectionRender = ({ section, embeddable, contents$ }: Props) => {
  const contents = useObservable(contents$);
  const [input, setInput] = useState<DashboardContainerInput>();

  useEffect(() => {
    if (section.kind === 'dashboard') {
      createDashboardSection(section, contents ?? []).then((ds) => setInput(ds));
    }
  }, [section, contents]);

  const factory = embeddable.getEmbeddableFactory('dashboard');

  if (section.kind === 'dashboard' && factory && input) {
    // const input = createDashboardSection(section, contents ?? []);
    console.log(input);
    return <EmbeddableRenderer factory={factory} input={input} />;
  }
  return null;
};
