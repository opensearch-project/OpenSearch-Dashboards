/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import { EuiButtonIcon, EuiSpacer, EuiTitle } from '@elastic/eui';
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
    return (
      // to make dashboard section align with others add margin left and right -8px
      <div style={{ margin: '-8px -8px 0 -8px' }}>
        <EmbeddableRenderer factory={factory} input={input} />
      </div>
    );
  }

  return null;
};

const CardSection = ({ section, embeddable, contents$ }: Props) => {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const contents = useObservable(contents$);
  const input = useMemo(() => {
    return createCardInput(section, contents ?? []);
  }, [section, contents]);

  const factory = embeddable.getEmbeddableFactory(CARD_CONTAINER);

  if (section.kind === 'card' && factory && input) {
    const isCardCollapsible = section.collapsible;
    return (
      <>
        {section.title ? (
          <>
            <EuiTitle size="s">
              <h2>
                {isCardCollapsible ? (
                  <EuiButtonIcon
                    iconType={isCardVisible ? 'arrowDown' : 'arrowRight'}
                    onClick={() => setIsCardVisible(!isCardVisible)}
                    color="text"
                    aria-label={isCardVisible ? 'Show panel' : 'Hide panel'}
                  />
                ) : null}
                {section.title}
              </h2>
            </EuiTitle>
            <EuiSpacer size="m" />
          </>
        ) : null}
        {isCardVisible && <EmbeddableRenderer factory={factory} input={input} />}
      </>
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
