/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_index.scss';
// @ts-ignore : Component not used
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../../../core/public';
import { LoginPage } from './login-page';
import { ClientConfigType } from '../../types';

export function renderApp(
  coreStart: CoreStart,
  params: AppMountParameters,
  config: ClientConfigType
) {
  ReactDOM.render(<LoginPage http={coreStart.http} config={config} />, params.element);
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
