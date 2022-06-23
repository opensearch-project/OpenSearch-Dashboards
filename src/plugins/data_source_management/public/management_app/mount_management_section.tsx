import { StartServicesAccessor } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';

import React from 'react';
import ReactDOM from 'react-dom';
import { DataSourceManagementApp } from '../components/app';
import { ManagementAppMountParams } from '../../../management/public';

import { DataSourceManagmentContext } from '../types';

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
}

export async function mountManagementSection(
  getStartServices: StartServicesAccessor<DataSourceManagementStartDependencies>,
  params: ManagementAppMountParams
) {
  const [
    { chrome, application, savedObjects, uiSettings, notifications, overlays, http, docLinks },
    { data },
  ] = await getStartServices();

  const deps: DataSourceManagmentContext = {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
  };

  ReactDOM.render(<DataSourceManagementApp services={deps} />, params.element);

  return () => {
    chrome.docTitle.reset();
    ReactDOM.unmountComponentAtNode(params.element);
  };
}
