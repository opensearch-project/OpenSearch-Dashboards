/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC, useState, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiButtonIcon,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import { RenderFn, Section as SectionType } from '../../../services/section_type/section_type';
import { LazyRender } from './lazy_render';

interface Props {
  render: RenderFn;
  title: SectionType['title'];
}

export const Section: FC<Props> = ({ render }) => {
  // Have to change the pattern here because recent work section adds a filter popover
  // and the filter popover can directly change the section content; current structure seperate
  // the render of these two components thus block the communication between the two
  const memoizedSection = useMemo(() => <LazyRender render={render} />, [render]);

  return (
    <EuiPanel
      hasBorder={false}
      hasShadow={false}
      color="transparent"
      data-test-subj="homepageSection"
    >
      {memoizedSection}
    </EuiPanel>
  );
};
