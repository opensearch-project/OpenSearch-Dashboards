/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useState, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiPanel, EuiButtonIcon, EuiTitle, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { RenderFn, Section as SectionType } from '../../../services/section_type/section_type';
import { LazyRender } from './lazy_render';

interface Props {
  render: RenderFn;
  title: SectionType['title'];
  headerComponent?: React.ReactNode;
}

export const Section: FC<Props> = ({ render, title, headerComponent }) => {
  const [isExpanded, setExpanded] = useState(true);
  const toggleExpanded = () => setExpanded((expanded) => !expanded);

  const memoizedContent = useMemo(
    () => (
      <EuiFlexGroup direction="row" data-test-subj="homepageSectionContent">
        <EuiFlexItem grow={3}>
          <LazyRender render={render} />
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    [render]
  );

  return (
    <EuiPanel
      hasBorder={false}
      hasShadow={false}
      color="transparent"
      data-test-subj="homepageSection"
    >
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow>
          <EuiTitle size="m">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{headerComponent}</EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            onClick={toggleExpanded}
            size="s"
            iconSize="m"
            color="text"
            aria-label={
              isExpanded
                ? i18n.translate('home.section.collapse', { defaultMessage: 'Collapse section' })
                : i18n.translate('home.section.expand', { defaultMessage: 'Expand section' })
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {isExpanded && memoizedContent}
    </EuiPanel>
  );
};
