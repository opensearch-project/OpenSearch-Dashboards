/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { Content, Section } from '../services';
import { EmbeddableInput, EmbeddableRenderer, EmbeddableStart } from '../../../embeddable/public';
import { DashboardContainerInput } from '../../../dashboard/public';
import { createCardSection, createDashboardSection } from './utils';
import { CARD_CONTAINER } from './card_container/card_container';
import { EuiTitle } from '@elastic/eui';

interface Props {
  section: Section;
  contents$: BehaviorSubject<Content[]>;
  embeddable: EmbeddableStart;
}

export interface CardInput extends EmbeddableInput {
  description: string;
}

const DashboardSection = ({ section, embeddable, contents$ }: Props) => {
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
    return <EmbeddableRenderer factory={factory} input={input} />;
  }

  return null;
};

const CardSection = ({ section, embeddable, contents$ }: Props) => {
  const contents = useObservable(contents$);
  const input = useMemo(() => {
    return createCardSection(section, contents ?? []);
  }, [section, contents]);

  const factory = embeddable.getEmbeddableFactory(CARD_CONTAINER);

  if (section.kind === 'card' && factory && input) {
    return (
      <div style={{ padding: '0 8px' }}>
        <EuiTitle size="s">
          <h2>{section.title}</h2>
        </EuiTitle>
        <EmbeddableRenderer factory={factory} input={input} />
      </div>
    );
  }

  return null;
};

export const SectionRender = ({ section, embeddable, contents$ }: Props) => {
  if (section.kind === 'dashboard') {
    return <DashboardSection section={section} embeddable={embeddable} contents$={contents$} />;
  }

  if (section.kind === 'card') {
    return <CardSection section={section} embeddable={embeddable} contents$={contents$} />;
  }

  return null;
};
