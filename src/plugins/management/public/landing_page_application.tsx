/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';

import { AppMountParameters } from 'opensearch-dashboards/public';
import { FeatureCards, FeatureCardsProps } from './components/feature_cards/feature_cards';

export const renderApp = ({
  mountElement,
  props,
}: {
  mountElement: AppMountParameters['element'];
  props: FeatureCardsProps;
}) => {
  ReactDOM.render(<FeatureCards {...props} />, mountElement);

  return () => ReactDOM.unmountComponentAtNode(mountElement);
};
