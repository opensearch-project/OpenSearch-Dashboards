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
import rison from 'rison-node';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutFooter,
  EuiFlyoutBody,
  EuiText,
} from '@elastic/eui';
import { LOGS_VIEW_ID } from '../../../../../../../common';
import { SavedObjectFinderUi } from '../../../../../../../../saved_objects/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { SAVED_OBJECT_TYPE } from '../../../../../../saved_explore/_saved_explore';

interface Props {
  onClose: () => void;
  makeUrl: (id: string) => string;
}

export function OpenSearchPanel({ onClose, makeUrl }: Props) {
  const {
    services: {
      core: { uiSettings, savedObjects, application },
      addBasePath,
      data,
      filterManager,
      store,
    },
  } = useOpenSearchDashboards<DiscoverViewServices>();

  return (
    <EuiFlyout ownFocus onClose={onClose} data-test-subj="loadSearchForm">
      <EuiFlyoutHeader hasBorder>
        <EuiText size="s">
          <h2>
            <FormattedMessage
              id="explore.discover.topNav.openSearchPanel.openSearchTitle"
              defaultMessage="OpenSearch"
            />
          </h2>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <SavedObjectFinderUi
          noItemsMessage={
            <FormattedMessage
              id="explore.discover.topNav.openSearchPanel.noSearchesFoundDescription"
              defaultMessage="No matching searches found."
            />
          }
          savedObjectMetaData={[
            {
              type: 'search',
              getIconForSavedObject: () => 'search',
              name: i18n.translate('explore.discover.savedSearch.savedObjectName', {
                defaultMessage: 'Saved search',
              }),
              includeFields: ['kibanaSavedObjectMeta'],
            },
            {
              type: SAVED_OBJECT_TYPE,
              getIconForSavedObject: () => 'integrationSearch',
              name: i18n.translate('explore.discover.savedExplore.savedObjectName', {
                defaultMessage: 'Saved explore',
              }),
              includeFields: ['kibanaSavedObjectMeta'],
            },
          ]}
          onChoose={(id, type) => {
            // Reset query app filters before loading saved search
            filterManager.setAppFilters([]);
            data.query.queryString.clearQuery();
            if (type === 'search') {
              // Explore will still show saved searches for backwards
              // compatibility, but they should open in classic Discover.
              application.navigateToApp('discover', { path: `#/view/${id}` });
            } else {
              // In classic Discover, URL goes from
              // app/data-explorer/discover#/ -> app/discover#/view/uuid ->
              // app/data-explorer/discover#/view/uuid, the appId change causes
              // a new store to be created using URL. In Explore, URL goes from
              // app/explore/logs#/ -> app/explore/logs#/view/uuid. There is no
              // appId change and no new store created, so we need to dispatch
              // the state change.
              store!.dispatch({ type: 'logs/incrementSaveExploreLoadCount' });
              application.navigateToApp('explore', { path: `${LOGS_VIEW_ID}#/view/${id}` });
            }
            onClose();
          }}
          uiSettings={uiSettings}
          savedObjects={savedObjects}
          application={application}
          data={data}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiSmallButtonEmpty
              onClick={onClose}
              href={addBasePath(
                `/app/management/opensearch-dashboards/objects?_a=${rison.encode({
                  tab: SAVED_OBJECT_TYPE,
                })}`
              )}
            >
              <FormattedMessage
                id="explore.discover.topNav.openSearchPanel.manageSearchesButtonLabel"
                defaultMessage="Manage searches"
              />
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
