/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';

import { AppMountParameters } from 'opensearch-dashboards/public';
import { FeatureCards, FeatureCardsProps } from './components/feature_cards/feature_cards';

export const renderApp = async ({
  params,
  props,
}: {
  params: AppMountParameters;
  props: FeatureCardsProps;
}) => {
  ReactDOM.render(<FeatureCards {...props} />, params.element);

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
