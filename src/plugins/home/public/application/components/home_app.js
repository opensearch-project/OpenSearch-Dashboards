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

import React, { useState, useEffect } from 'react';
import { ExperienceSelectionModal } from './explore_experience';
import { I18nProvider } from '@osd/i18n/react';
import PropTypes from 'prop-types';
import { Home } from './legacy/home';
import { FeatureDirectory } from './feature_directory';
import { TutorialDirectory } from './tutorial_directory';
import { Tutorial } from './tutorial/tutorial';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { getTutorial } from '../load_tutorials';
import { replaceTemplateStrings } from './tutorial/replace_template_strings';
import { getServices } from '../opensearch_dashboards_services';
import { useMount } from 'react-use';
import { USE_NEW_HOME_PAGE } from '../../../common/constants';
import { HOME_PAGE_ID } from '../../../../content_management/public';

const KEY_EXPERIENCE_NOTICE_DISMISSED_CONFIG = 'explore-experience-notice-dismissed';
const KEY_EXPERIENCE_NOTICE_DISMISSED_LOCAL_STORAGE = 'home:enhancedDiscover:dismissed';

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
    homeConfig,
  } = getServices();

  const [showExperienceSelection, setShowExperienceSelection] = useState(false);
  const [isCheckingExperience, setIsCheckingExperience] = useState(true);

  useEffect(() => {
    const checkExperienceSelection = async () => {
      // Check if experience modal is disabled in configuration
      if (homeConfig.disableExperienceModal) {
        setShowExperienceSelection(false);
        setIsCheckingExperience(false);
        return;
      }

      // First check local storage (for read-only users)
      try {
        const localDismissed = localStorage.getItem(KEY_EXPERIENCE_NOTICE_DISMISSED_LOCAL_STORAGE);
        if (localDismissed === 'true') {
          setShowExperienceSelection(false);
          setIsCheckingExperience(false);
          return;
        }
      } catch (storageErr) {
        // Ignore storage errors and continue with saved objects check
      }

      // Then check saved objects (for users with write permissions)
      try {
        const result = await savedObjectsClient.get(
          'config',
          KEY_EXPERIENCE_NOTICE_DISMISSED_CONFIG
        );

        if (result.error?.statusCode === 404) {
          // Not dismissed yet - show modal
          setShowExperienceSelection(true);
        } else {
          // Other error - don't show
          setShowExperienceSelection(false);
        }
        return;
      } catch (error) {
        setShowExperienceSelection(false);
      } finally {
        setIsCheckingExperience(false);
      }
    };

    checkExperienceSelection();
  }, [savedObjectsClient, homeConfig.disableExperienceModal]);

  const dismissExperienceSelection = async () => {
    let savedObjectSuccess = false;

    try {
      const result = await savedObjectsClient.create(
        'config',
        { dismissedAt: new Date().toISOString() },
        { id: KEY_EXPERIENCE_NOTICE_DISMISSED_CONFIG, overwrite: true }
      );
      if (!result.error) {
        savedObjectSuccess = true;
      }
    } catch (err) {
      // eslint-disable-next-line no-empty
    } finally {
      // If saving to savedObjects failed for any reason or for read-only user, use local storage as fallback
      if (!savedObjectSuccess) {
        try {
          localStorage.setItem(KEY_EXPERIENCE_NOTICE_DISMISSED_LOCAL_STORAGE, 'true');
        } catch (storageErr) {
          console.error('Failed to save dismissal to local storage:', storageErr);
        }
      }

      // Always dismiss the modal
      setShowExperienceSelection(false);
    }
  };

  // Show loading or modal before rendering routes
  if (isCheckingExperience) {
    return null; // or a loading spinner
  }

  if (showExperienceSelection) {
    return (
      <I18nProvider>
        <ExperienceSelectionModal onClose={dismissExperienceSelection} />
      </I18nProvider>
    );
  }

  const environment = environmentService.getEnvironment();
  const isCloudEnabled = environment.cloud;

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

  const homepage = contentManagement.renderPage(HOME_PAGE_ID);

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
                {homepage}
              </Route>
            </>
          ) : (
            <>
              <Route exact path="/next-home">
                {homepage}
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
