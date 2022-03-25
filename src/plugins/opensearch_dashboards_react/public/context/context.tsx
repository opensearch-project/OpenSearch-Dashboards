/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import * as React from 'react';
import {
  OpenSearchDashboardsReactContext,
  OpenSearchDashboardsReactContextValue,
  OpenSearchDashboardsServices,
} from './types';
import { createReactOverlays } from '../overlays';
import { createNotifications } from '../notifications';

const { useMemo, useContext, createElement, createContext } = React;

const defaultContextValue = {
  services: {},
  overlays: createReactOverlays({}),
  notifications: createNotifications({}),
};

export const context = createContext<
  OpenSearchDashboardsReactContextValue<OpenSearchDashboardsServices>
>(defaultContextValue);

export const useOpenSearchDashboards = <
  Extra extends object = {}
>(): OpenSearchDashboardsReactContextValue<OpenSearchDashboardsServices & Extra> =>
  useContext(
    (context as unknown) as React.Context<
      OpenSearchDashboardsReactContextValue<OpenSearchDashboardsServices & Extra>
    >
  );

export const withOpenSearchDashboards = <
  Props extends { opensearchDashboards: OpenSearchDashboardsReactContextValue<any> }
>(
  type: React.ComponentType<Props>
): React.FC<Omit<Props, 'opensearchDashboards'>> => {
  const EnhancedType: React.FC<Omit<Props, 'opensearchDashboards'>> = (
    props: Omit<Props, 'opensearchDashboards'>
  ) => {
    const opensearchDashboards = useOpenSearchDashboards();
    return React.createElement(type, { ...props, opensearchDashboards } as Props);
  };
  return EnhancedType;
};

export const UseOpenSearchDashboards: React.FC<{
  children: (opensearchDashboards: OpenSearchDashboardsReactContextValue<any>) => React.ReactNode;
}> = ({ children }) => <>{children(useOpenSearchDashboards())}</>;

export const createOpenSearchDashboardsReactContext = <
  Services extends OpenSearchDashboardsServices
>(
  services: Services
): OpenSearchDashboardsReactContext<Services> => {
  const value: OpenSearchDashboardsReactContextValue<Services> = {
    services,
    overlays: createReactOverlays(services),
    notifications: createNotifications(services),
  };

  const Provider: React.FC<{ services?: Services }> = ({
    services: newServices = {},
    children,
  }) => {
    const oldValue = useOpenSearchDashboards();
    const { value: newValue } = useMemo(
      () =>
        createOpenSearchDashboardsReactContext({
          ...services,
          ...oldValue.services,
          ...newServices,
        }),
      [services, oldValue, newServices]
    );
    return createElement(context.Provider as React.ComponentType<any>, {
      value: newValue,
      children,
    });
  };

  return {
    value,
    Provider,
    Consumer: (context.Consumer as unknown) as React.Consumer<
      OpenSearchDashboardsReactContextValue<Services>
    >,
  };
};

export const {
  Provider: OpenSearchDashboardsContextProvider,
} = createOpenSearchDashboardsReactContext({});
