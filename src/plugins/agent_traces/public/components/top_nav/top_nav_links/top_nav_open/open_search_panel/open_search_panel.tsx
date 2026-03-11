/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
TODO: This file needs to be updated.
-  loading saved agent traces breaks the top nav. I don't think we should use URL to update it
- classic saved searches do not show up in the panel
- this file needs unit tests once above has been resolved.
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
import { AgentTracesFlavor } from '../../../../../../common';
import { SavedObjectFinderUi } from '../../../../../../../saved_objects/public';
import { SAVED_OBJECT_TYPE } from '../../../../../saved_agent_traces/_saved_agent_traces';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../../types';

export interface OpenSearchPanelProps {
  onClose: () => void;
}

const savedObjectMetadata = [
  // NOTE: Should saved search be included?
  {
    type: 'search',
    getIconForSavedObject: () => 'search',
    name: i18n.translate('agentTraces.savedSearch.savedObjectName', {
      defaultMessage: 'Saved search',
    }),
    includeFields: ['kibanaSavedObjectMeta'],
  },
  {
    type: SAVED_OBJECT_TYPE,
    getIconForSavedObject: () => 'integrationSearch',
    name: i18n.translate('agentTraces.savedAgentTraces.savedObjectName', {
      defaultMessage: 'Saved agent traces',
    }),
    includeFields: ['kibanaSavedObjectMeta', 'type'],
  },
];

export const OpenSearchPanel = ({ onClose }: OpenSearchPanelProps) => {
  const {
    services: {
      core: { uiSettings, savedObjects, application },
      addBasePath,
      data,
      filterManager,
      store,
    },
  } = useOpenSearchDashboards<AgentTracesServices>();

  return (
    <EuiFlyout ownFocus onClose={onClose} data-test-subj="loadSearchForm">
      <EuiFlyoutHeader hasBorder>
        <EuiText size="s">
          <h2>
            <FormattedMessage
              id="agentTraces.discover.topNav.openSearchPanel.openSavedTitle"
              defaultMessage="Select Saved Search"
            />
          </h2>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <SavedObjectFinderUi
          noItemsMessage={
            <FormattedMessage
              id="agentTraces.topNav.openSearchPanel.noSearchesFoundDescription"
              defaultMessage="No matching searches found."
            />
          }
          savedObjectMetaData={savedObjectMetadata}
          onChoose={(id, type, _, savedObject) => {
            // Reset query app filters before loading saved search
            filterManager.setAppFilters([]);
            data.query.queryString.clearQuery();
            if (type === 'search') {
              // Agent Traces will still show saved searches for backwards
              // compatibility, but they should open in classic Discover.
              application.navigateToApp('discover', { path: `#/view/${id}` });
            } else {
              // In classic Discover, URL goes from
              // app/data-explorer/discover#/ -> app/discover#/view/uuid ->
              // app/data-explorer/discover#/view/uuid, the appId change causes
              // a new store to be created using URL. In Agent Traces, URL goes from
              // app/agentTraces/logs#/ -> app/agentTraces/logs#/view/uuid. There is no
              // appId change and no new store created, so we need to dispatch
              // the state change.
              store.dispatch({ type: 'logs/incrementSaveAgentTracesLoadCount' });
              // TODO: Nav link is generated in runtime. Different from discover, if using navigateToApp, top nav would disappear.
              // Address once flavor and view route are finalized.
              const flavor = savedObject.attributes.type ?? AgentTracesFlavor.Traces;
              // application.navigateToApp('agentTraces', {
              //   // TODO:finalize this until flavor and view route are finalized
              //   path: `${flavor}#/view/${id}`,
              // });
              // NOTE: Use this for now instead of navigateToApp to avoid the top nav disappearing
              const url = application.getUrlForApp(`agentTraces/${flavor}`, {
                path: `#/view/${id}`,
              });
              application.navigateToUrl(url);
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
                id="agentTraces.topNav.openSearchPanel.manageSearchesButtonLabel"
                defaultMessage="Manage searches"
              />
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
