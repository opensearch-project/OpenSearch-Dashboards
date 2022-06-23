// import React from 'react';
// import ReactDOM from 'react-dom';
// import { Router, Switch, Route } from 'react-router-dom';

// import { i18n } from '@osd/i18n';
// import { I18nProvider } from '@osd/i18n/react';
// import { StartServicesAccessor } from 'src/core/public';

// import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
// import { ManagementAppMountParams } from '../../../management/public';
// import {
//   IndexPatternTableWithRouter,
//   EditIndexPatternContainer,
//   CreateEditFieldContainer,
//   CreateIndexPatternWizardWithRouter,
// } from '../components';
// import { IndexPatternManagementStartDependencies, IndexPatternManagementStart } from '../plugin';
// import { IndexPatternManagmentContext, MlCardState } from '../types';

// const readOnlyBadge = {
//   text: i18n.translate('indexPatternManagement.indexPatterns.badge.readOnly.text', {
//     defaultMessage: 'Read only',
//   }),
//   tooltip: i18n.translate('indexPatternManagement.indexPatterns.badge.readOnly.tooltip', {
//     defaultMessage: 'Unable to save index patterns',
//   }),
//   iconType: 'glasses',
// };

import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import React from 'react';
import ReactDOM from 'react-dom';
import { DataSourceManagementApp } from '../components/app';
import { ManagementAppMountParams } from '../../../management/public';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
  ] = await getStartServices();

  ReactDOM.render(<DataSourceManagementApp http={http} />, params.element);

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
