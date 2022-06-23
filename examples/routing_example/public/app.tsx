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

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'opensearch-dashboards/public';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiText,
  EuiHorizontalRule,
  EuiPageContentHeader,
  EuiListGroup,
} from '@elastic/eui';
import { RandomNumberRouteExample } from './random_number_example';
import { RandomNumberBetweenRouteExample } from './random_number_between_example';
import { Services } from './services';
import { PostMessageRouteExample } from './post_message_example';
import { GetMessageRouteExample } from './get_message_example';

type Props = Services;

function RoutingExplorer({
  fetchRandomNumber,
  fetchRandomNumberBetween,
  addSuccessToast,
  postMessage,
  getMessageById,
}: Props) {
  return (
    <EuiPage>
      <EuiPageBody component="main">
        <EuiPageContent>
          <EuiPageContentHeader>
            <EuiText>
              <h1>Routing examples</h1>
            </EuiText>
          </EuiPageContentHeader>
          <EuiText>
            <EuiListGroup
              listItems={[
                {
                  label: 'IRouter API docs',
                  href:
                    'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/docs/development/core/server/opensearch-dashboards-plugin-core-server.irouter.md',
                  iconType: 'logoGithub',
                  target: '_blank',
                  size: 's',
                },
                {
                  label: 'HttpHandler (core.http.fetch) API docs',
                  href:
                    'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/docs/development/core/public/opensearch-dashboards-plugin-core-public.httphandler.md',
                  iconType: 'logoGithub',
                  target: '_blank',
                  size: 's',
                },
                {
                  label: 'Conventions',
                  href:
                    'https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/DEVELOPER_GUIDE.md#api-endpoints',
                  iconType: 'logoGithub',
                  target: '_blank',
                  size: 's',
                },
              ]}
            />
          </EuiText>
          <EuiHorizontalRule />
          <RandomNumberRouteExample fetchRandomNumber={fetchRandomNumber} />
          <EuiHorizontalRule />
          <RandomNumberBetweenRouteExample fetchRandomNumberBetween={fetchRandomNumberBetween} />

          <EuiHorizontalRule />
          <PostMessageRouteExample addSuccessToast={addSuccessToast} postMessage={postMessage} />

          <EuiHorizontalRule />
          <GetMessageRouteExample getMessageById={getMessageById} />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}

export const renderApp = (props: Props, element: AppMountParameters['element']) => {
  ReactDOM.render(<RoutingExplorer {...props} />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
