import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiTitle,
} from '@elastic/eui';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { CoreStart } from '../../../../core/public';
import { UploadForm } from './upload_form';
import { PLUGIN_NAME } from '../../common';

interface DataUploaderAppDeps {
  http: CoreStart['http'];
  basename: string;
  notifications: CoreStart['notifications'];
  navigation: NavigationPublicPluginStart;
}

export const DataUploaderApp = ({
  basename,
  notifications,
  http,
  navigation,
}: DataUploaderAppDeps) => (
  <Router basename={basename}>
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>{PLUGIN_NAME}</h1>
          </EuiTitle>
        </EuiPageHeader>
        <EuiPageContent>
          <EuiPageContentBody>
            <UploadForm http={http} notifications={notifications} />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  </Router>
);
