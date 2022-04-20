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
  EuiText,
  EuiTabbedContent,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { BasicTab } from './basic_tab';
import { RenderTab } from './render_tab';
import { ActionsTab } from './actions_tab';
import { PlaygroundTab } from './playground_tab';
import { ExplorerTab } from './explorer_tab';

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
        id: 'demo-1',
        name: (
          <FormattedMessage
            id="expressionsExample.demo1.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Basic' }}
          />
        ),
        content: <BasicTab />,
      },
      {
        id: 'demo-2',
        name: (
          <FormattedMessage
            id="expressionsExample.demo2.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Rendering' }}
          />
        ),
        content: <RenderTab />,
      },
      {
        id: 'demo-3',
        name: (
          <FormattedMessage
            id="expressionsExample.demo3.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Handlers' }}
          />
        ),
        content: <ActionsTab />,
      },
      {
        id: 'playground',
        name: (
          <FormattedMessage
            id="expressionsExample.playground.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Playground' }}
          />
        ),
        content: <PlaygroundTab />,
      },
      {
        id: 'explorer',
        name: (
          <FormattedMessage
            id="expressionsExample.explorer.TabTitle"
            defaultMessage="{name}"
            values={{ name: 'Explorer' }}
          />
        ),
        content: <ExplorerTab />,
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
                  <EuiText>
                    <p>
                      <FormattedMessage
                        id="expressionsExample.congratulationsTitle"
                        defaultMessage="Lets look at some of the ways we can run expressions"
                      />
                    </p>
                  </EuiText>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EuiTabbedContent tabs={tabs} initialSelectedTab={tabs[0]} />
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
