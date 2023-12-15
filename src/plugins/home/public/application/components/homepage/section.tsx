/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useState } from 'react';
import { EuiPanel, EuiButtonIcon, EuiTitle } from '@elastic/eui';
import { RenderFn } from '../../../services/section_type/section_type';
import { LazyRender } from './lazy_render';

interface Props {
  render: RenderFn;
  title: string;
  description?: string;
  links?: Array<{ title: string; url: string }>;
}

// TODO: the way this is implemented currently will mount and unmount whenever the section is expanded/collapsed. Do we want to keep it this way?
export const Section: FC<Props> = ({ render, title }) => {
  const [isExpanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded((expanded) => !expanded);

  return (
    <EuiPanel hasBorder={false} hasShadow={false} paddingSize="none" color="transparent">
      <EuiButtonIcon iconType={isExpanded ? 'arrowDown' : 'arrowRight'} onClick={toggleExpanded} />
      <EuiTitle>
        <h2>{title}</h2>
      </EuiTitle>
      {isExpanded && <LazyRender render={render} />}
    </EuiPanel>
  );
};
