/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppMountParameters } from 'opensearch-dashboards/public';
import { FeatureCards, FeatureCardsProps } from './components/feature_cards/feature_cards';

export const renderApp = ({
  mountElement,
  props,
}: {
  mountElement: AppMountParameters['element'];
  props: FeatureCardsProps;
}) => {
  const root = createRoot(mountElement);
  root.render(<FeatureCards {...props} />);

  return () => root.unmount();
};
