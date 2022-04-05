/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiTabbedContent,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { BasicTab } from './basic_tab';
import { RenderTab } from './render_tab';

interface ExpressionsExampleAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const ExpressionsExampleApp = ({ basename }: ExpressionsExampleAppDeps) => {
  const tabs = useMemo(
    () => [
      {
        id: 'demo1',
        name: (
          <FormattedMessage
            id="expressionsExample.demo1TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Basic' }}
          />
        ),
        content: <BasicTab />,
      },
      {
        id: 'demo2',

        name: (
          <FormattedMessage
            id="expressionsExample.demo2TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Rendering' }}
          />
        ),
        content: <RenderTab />,
      },
    ],
    []
  );
  // Render the application DOM.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <EuiPage className="expressions-demo" restrictWidth="1500px">
            <EuiPageBody component="main">
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage
                      id="expressionsExample.appTitle"
                      defaultMessage="{name}"
                      values={{ name: 'Expressions' }}
                    />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent>
                <EuiPageContentHeader>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage
                        id="expressionsExample.congratulationsTitle"
                        defaultMessage="Lets take a quick look at what we can do with expressions"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EuiTabbedContent tabs={tabs} initialSelectedTab={tabs[1]} />
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
