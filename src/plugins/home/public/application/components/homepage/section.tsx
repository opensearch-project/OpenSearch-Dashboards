/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useState, useMemo } from 'react';
import {
  EuiPanel,
  EuiButtonIcon,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiLink,
} from '@elastic/eui';
import { RenderFn, Section as SectionType } from '../../../services/section_type/section_type';
import { LazyRender } from './lazy_render';

interface Props {
  render: RenderFn;
  title: SectionType['title'];
  description?: SectionType['description'];
  links?: SectionType['links'];
}

// TODO: the way this is implemented currently will mount and unmount whenever the section is expanded/collapsed. Do we want to keep it this way?
export const Section: FC<Props> = ({ render, title, description, links }) => {
  const [isExpanded, setExpanded] = useState(true);

  const hasDescription = !!description;
  const hasLinks = !!links && links.length > 0;
  const hasDescriptionSection = hasDescription || hasLinks;
  const hasDescriptionSpacer = hasDescription && hasLinks;

  const toggleExpanded = () => setExpanded((expanded) => !expanded);

  const memoizedContent = useMemo(
    () => (
      <EuiFlexGroup direction="row">
        {hasDescriptionSection && (
          <EuiFlexItem grow={1}>
            {description}
            {hasDescriptionSpacer && <EuiSpacer />}
            {hasLinks &&
              links.map(({ label, url }, i) => (
                <EuiLink key={i} href={url}>
                  {label}
                </EuiLink>
              ))}
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={3}>
          <LazyRender render={render} />
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    [description, hasDescriptionSection, hasDescriptionSpacer, hasLinks, links, render]
  );

  return (
    <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none" color="transparent">
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={isExpanded ? 'arrowUp' : 'arrowRight'}
            onClick={toggleExpanded}
            size="s"
            iconSize="m"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          />
        </EuiFlexItem>
        <EuiFlexItem grow>
          <EuiTitle size="l">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isExpanded && memoizedContent}
    </EuiPanel>
  );
};
