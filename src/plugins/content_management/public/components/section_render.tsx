/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import { EuiButtonIcon, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { Content, Section } from '../services';
import { EmbeddableInput, EmbeddableRenderer, EmbeddableStart } from '../../../embeddable/public';
import { DashboardContainerInput } from '../../../dashboard/public';
import { createCardInput, createDashboardInput } from './section_input';
import { CARD_CONTAINER } from './card_container/card_container';

interface Props {
  section: Section;
  contents$: BehaviorSubject<Content[]>;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
}

export interface CardInput extends EmbeddableInput {
  description: string;
}

const DashboardSection = ({ section, embeddable, contents$, savedObjectsClient }: Props) => {
  const contents = useObservable(contents$);
  const [input, setInput] = useState<DashboardContainerInput>();

  useEffect(() => {
    if (section.kind === 'dashboard') {
      createDashboardInput(section, contents ?? [], { savedObjectsClient }).then((ds) =>
        setInput(ds)
      );
    }
  }, [section, contents, savedObjectsClient]);

  const factory = embeddable.getEmbeddableFactory('dashboard');

  if (section.kind === 'dashboard' && factory && input) {
    // const input = createDashboardSection(section, contents ?? []);
    return <EmbeddableRenderer factory={factory} input={input} />;
  }

  return null;
};

const CardSection = ({ section, embeddable, contents$ }: Props) => {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const toggleCardVisibility = () => {
    setIsCardVisible(!isCardVisible);
  };
  const contents = useObservable(contents$);
  const input = useMemo(() => {
    return createCardInput(section, contents ?? []);
  }, [section, contents]);

  const factory = embeddable.getEmbeddableFactory(CARD_CONTAINER);

  if (section.kind === 'card' && factory && input) {
    return (
      <EuiPanel>
        <EuiTitle size="s">
          <h2>
            <EuiButtonIcon
              iconType={isCardVisible ? 'arrowDown' : 'arrowUp'}
              onClick={toggleCardVisibility}
              color="text"
              aria-label={isCardVisible ? 'Show panel' : 'Hide panel'}
            />
            {section.title}
          </h2>
        </EuiTitle>
        {isCardVisible && (
          <>
            <EuiSpacer size="m" /> <EmbeddableRenderer factory={factory} input={input} />
          </>
        )}
      </EuiPanel>
    );
  }

  return null;
};

const CustomSection = ({ section, contents$ }: Props) => {
  const contents = useObservable(contents$);

  if (section.kind === 'custom' && contents) {
    return section.render(contents);
  }

  return null;
};

export const SectionRender = (props: Props) => {
  if (props.section.kind === 'dashboard') {
    return <DashboardSection {...props} />;
  }

  if (props.section.kind === 'card') {
    return <CardSection {...props} />;
  }

  if (props.section.kind === 'custom') {
    return <CustomSection {...props} />;
  }

  return null;
};
