/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
import { EuiPanel } from '@elastic/eui';
import { RenderFn } from '../../../services/section_type/section_type';
import { LazyRender } from './lazy_render';

interface Props {
  render: RenderFn;
}

export const HeroSection: FC<Props> = ({ render }) => {
  return (
    <EuiPanel data-test-subj="homepageHeroSection">
      <LazyRender render={render} />
    </EuiPanel>
  );
};
