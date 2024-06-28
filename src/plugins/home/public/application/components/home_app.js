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
import { I18nProvider } from '@osd/i18n/react';
import PropTypes from 'prop-types';
import { Home } from './legacy/home';
import { Homepage } from './homepage';
import { FeatureDirectory } from './feature_directory';
import { TutorialDirectory } from './tutorial_directory';
import { Tutorial } from './tutorial/tutorial';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { getTutorial } from '../load_tutorials';
import { replaceTemplateStrings } from './tutorial/replace_template_strings';
import { getServices } from '../opensearch_dashboards_services';
import { useMount } from 'react-use';
import { USE_NEW_HOME_PAGE } from '../../../common/constants';
import { PageRender } from '../../../../content_management/public';

const RedirectToDefaultApp = () => {
  useMount(() => {
    const { urlForwarding } = getServices();
    urlForwarding.navigateToDefaultApp();
  });
  return null;
};

const renderTutorialDirectory = (props) => {
  const { addBasePath, environmentService } = getServices();
  const environment = environmentService.getEnvironment();
  const isCloudEnabled = environment.cloud;

  return (
    <TutorialDirectory
      addBasePath={addBasePath}
      openTab={props.match.params.tab}
      isCloudEnabled={isCloudEnabled}
      withoutHomeBreadCrumb={props.withoutHomeBreadCrumb}
    />
  );
};

export function ImportSampleDataApp() {
  return (
    <I18nProvider>
      {renderTutorialDirectory({
        // Pass a fixed tab to avoid TutorialDirectory missing openTab property
        match: {
          params: { tab: 'sampleData' },
        },
        withoutHomeBreadCrumb: true,
      })}
    </I18nProvider>
  );
}

export function HomeApp({ directories, solutions }) {
  const {
    savedObjectsClient,
    getBasePath,
    addBasePath,
    environmentService,
    telemetry,
    uiSettings,
    contentManagement,
    embeddable,
  } = getServices();
  const environment = environmentService.getEnvironment();
  const isCloudEnabled = environment.cloud;
  const page = contentManagement.getPage('home');

  const renderTutorial = (props) => {
    return (
      <Tutorial
        addBasePath={addBasePath}
        isCloudEnabled={isCloudEnabled}
        getTutorial={getTutorial}
        replaceTemplateStrings={replaceTemplateStrings}
        tutorialId={props.match.params.id}
        bulkCreate={savedObjectsClient.bulkCreate}
      />
    );
  };

  const legacyHome = (
    <Home
      addBasePath={addBasePath}
      directories={directories}
      solutions={solutions}
      find={savedObjectsClient.find}
      localStorage={localStorage}
      urlBasePath={getBasePath()}
      telemetry={telemetry}
    />
  );

  const homepage = <Homepage />;

  const nextHome = <PageRender page={page} embeddable={embeddable} />;

  return (
    <I18nProvider>
      <Router>
        <Switch>
          <Route path="/tutorial/:id" render={renderTutorial} />
          <Route path="/tutorial_directory/:tab?" render={renderTutorialDirectory} />
          <Route exact path="/feature_directory">
            <FeatureDirectory addBasePath={addBasePath} directories={directories} />
          </Route>
          {uiSettings.get(USE_NEW_HOME_PAGE) ? (
            <>
              <Route exact path="/legacy-home">
                {legacyHome}
              </Route>
              <Route exact path="/">
                {nextHome}
              </Route>
            </>
          ) : (
            <>
              <Route exact path="/next-home">
                {nextHome}
              </Route>
              <Route exact path="/">
                {legacyHome}
              </Route>
            </>
          )}
          <Route path="*" exact={true} component={RedirectToDefaultApp} />
        </Switch>
      </Router>
    </I18nProvider>
  );
}

HomeApp.propTypes = {
  directories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      showOnHomePage: PropTypes.bool.isRequired,
      category: PropTypes.string.isRequired,
      order: PropTypes.number,
      solutionId: PropTypes.string,
    })
  ),
  solutions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string.isRequired,
      description: PropTypes.string,
      appDescriptions: PropTypes.arrayOf(PropTypes.string).isRequired,
      icon: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      order: PropTypes.number,
    })
  ),
};
