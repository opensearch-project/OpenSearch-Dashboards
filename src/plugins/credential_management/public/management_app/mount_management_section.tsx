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

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';

// TODO: Clean up this file after creation UX added
// import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';

// import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
// import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from '/src/plugins/data/public';
import { ManagementAppMountParams } from '../../../management/public';
// import {
//   IndexPatternTableWithRouter,
//   EditIndexPatternContainer,
//   CreateEditFieldContainer,
//   CreateIndexPatternWizardWithRouter,
// } from '../components';
// import { CredentialManagementStart } from '../plugin';
import { CredentialsTableWithRouter, CreateIndexPatternWizardWithRouter } from '../components';
import { CredentialManagementContext } from '../types';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

export interface CredentialManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<CredentialManagementStartDependencies>,
  params: ManagementAppMountParams
//   getMlCardState: () => MlCardState
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data },
    // indexPatternManagementStart,
  ] = await getStartServices();
//   const canSave = Boolean(application.capabilities.indexPatterns.save);

//   if (!canSave) {
//     chrome.setBadge(readOnlyBadge);
//   }

  const deps: CredentialManagementContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    // indexPatternManagementStart: indexPatternManagementStart as IndexPatternManagementStart,
    // setBreadcrumbs: params.setBreadcrumbs,
    // getMlCardState,
  };

  // ReactDOM.render(
  //   <OpenSearchDashboardsContextProvider services={deps}>
  //     <I18nProvider>
  //       <Router history={params.history}>
  //         <Switch>
  //           <Route path={['/create']}>
  //             <CreateIndexPatternWizardWithRouter />
  //           </Route>
  //           <Route path={['/credentials/:id/field/:fieldName', '/patterns/:id/create-field/']}>
  //               <CreateEditFieldContainer />
  //             </Route>
  //           <Route path={['/credentials/:id']}>
  //             <EditCredentialContainer />
  //           </Route>
  //         </Switch>
  //       </Router>
  //     </I18nProvider>
  //   </OpenSearchDashboardsContextProvider>,
  //   params.element
  // );

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={deps}>
      <I18nProvider>
        <Router history={params.history}>
          <Switch>
            <Route path={['/']}>
              <CredentialsTableWithRouter canSave={true} />
            </Route>
            {/* <Route path={['/create']}>
              <CreateIndexPatternWizardWithRouter />
            </Route> */}
          </Switch>
        </Router>
      </I18nProvider>
    </OpenSearchDashboardsContextProvider>,
     params.element
  );
  
  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
