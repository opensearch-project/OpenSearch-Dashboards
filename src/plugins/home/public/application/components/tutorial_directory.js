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

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Synopsis } from './synopsis';
import { SampleDataSetCards } from './sample_data_set_cards';
import { getServices } from '../opensearch_dashboards_services';

import {
  EuiPage,
  EuiPanel,
  EuiTabs,
  EuiTab,
  EuiFlexItem,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiSpacer,
  EuiPageBody,
  EuiText,
} from '@elastic/eui';

import { getTutorials } from '../load_tutorials';
import { injectI18n, FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { DataSourceSelector, DataSourceMenu } from '../../../../data_source_management/public';
import {
  MountPointPortal,
  withOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';

const ALL_TAB_ID = 'all';
const SAMPLE_DATA_TAB_ID = 'sampleData';

const homeTitle = i18n.translate('home.breadcrumbs.homeTitle', { defaultMessage: 'Home' });
const addDataTitle = i18n.translate('home.breadcrumbs.addDataTitle', {
  defaultMessage: 'Add data',
});
const sampleDataTitle = i18n.translate('home.breadcrumbs.sampleDataTitle', {
  defaultMessage: 'Sample data',
});

class TutorialDirectoryUi extends React.Component {
  constructor(props) {
    super(props);

    // TODO: Enable the tabs once we have instructions
    // and sample code snippets to instruct users to add data
    this.tabs = [];

    let openTab = SAMPLE_DATA_TAB_ID;
    if (
      props.openTab &&
      this.tabs.some((tab) => {
        return tab.id === props.openTab;
      })
    ) {
      openTab = props.openTab;
    }
    this.state = {
      selectedTabId: openTab,
      tutorialCards: [],
      notices: getServices().tutorialService.getDirectoryNotices(),
      isDataSourceEnabled: !!getServices().dataSource,
      isLocalClusterHidden: getServices().dataSource?.hideLocalCluster ?? false,
      useUpdatedUX: getServices().uiSettings.get('home:useNewHomePage'),
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    const { chrome } = getServices();
    const { withoutHomeBreadCrumb } = this.props;
    const breadcrumbs = [{ text: this.state.useUpdatedUX ? sampleDataTitle : addDataTitle }];
    if (!withoutHomeBreadCrumb) {
      breadcrumbs.splice(0, 0, {
        text: homeTitle,
        href: '#/',
      });
    }

    chrome.setBreadcrumbs(breadcrumbs);

    const tutorialConfigs = await getTutorials();

    if (!this._isMounted) {
      return;
    }

    let tutorialCards = tutorialConfigs.map((tutorialConfig) => {
      // add base path to SVG based icons
      let icon = tutorialConfig.euiIconType;
      if (icon && icon.includes('/')) {
        icon = this.props.addBasePath(icon);
      }

      return {
        id: tutorialConfig.id,
        category: tutorialConfig.category,
        icon: icon,
        name: tutorialConfig.name,
        description: tutorialConfig.shortDescription,
        url: this.props.addBasePath(`#/tutorial/${tutorialConfig.id}`),
        elasticCloud: tutorialConfig.elasticCloud,
        // Beta label is skipped on the tutorial overview page for now. Too many beta labels.
        //isBeta: tutorialConfig.isBeta,
      };
    });

    // Add card for sample data that only gets show in "all" tab
    tutorialCards.push({
      id: 'sample_data',
      name: this.props.intl.formatMessage({
        id: 'home.tutorial.card.sampleDataTitle',
        defaultMessage: 'Sample Data',
      }),
      description: this.props.intl.formatMessage({
        id: 'home.tutorial.card.sampleDataDescription',
        defaultMessage:
          'Get started exploring OpenSearch Dashboards with these "one click" data sets.',
      }),
      url: this.props.addBasePath('#/tutorial_directory/sampleData'),
      elasticCloud: true,
      onClick: this.onSelectedTabChanged.bind(null, SAMPLE_DATA_TAB_ID),
    });

    if (this.props.isCloudEnabled) {
      tutorialCards = tutorialCards.filter((tutorial) => {
        return _.has(tutorial, 'elasticCloud');
      });
    }

    tutorialCards.sort((a, b) => {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    this.setState({
      // eslint-disable-line react/no-did-mount-set-state
      tutorialCards: tutorialCards,
    });
  }

  onSelectedTabChanged = (id) => {
    this.setState({
      selectedTabId: id,
    });
  };

  renderTabs = () => {
    return this.tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  renderTabContent = () => {
    if (this.state.selectedTabId === SAMPLE_DATA_TAB_ID) {
      return (
        <SampleDataSetCards
          addBasePath={this.props.addBasePath}
          dataSourceId={this.state.selectedDataSourceId}
          isDataSourceEnabled={this.state.isDataSourceEnabled}
          isLocalClusterHidden={this.state.isLocalClusterHidden}
          useUpdatedUX={this.state.useUpdatedUX}
        />
      );
    }

    return (
      <EuiFlexGrid columns={4}>
        {this.state.tutorialCards
          .filter((tutorial) => {
            return (
              this.state.selectedTabId === ALL_TAB_ID ||
              this.state.selectedTabId === tutorial.category
            );
          })
          .map((tutorial) => {
            return (
              <EuiFlexItem key={tutorial.name}>
                <Synopsis
                  id={tutorial.id}
                  iconType={tutorial.icon}
                  description={tutorial.description}
                  title={tutorial.name}
                  wrapInPanel
                  url={tutorial.url}
                  onClick={tutorial.onClick}
                  isBeta={tutorial.isBeta}
                />
              </EuiFlexItem>
            );
          })}
      </EuiFlexGrid>
    );
  };

  onSelectedDataSourceChange = (e) => {
    const dataSourceId = e[0] ? e[0].id : undefined;
    this.setState({ selectedDataSourceId: dataSourceId });
  };

  renderDataSourceSelector = () => {
    const { isDataSourceEnabled, isLocalClusterHidden, useUpdatedUX } = this.state;
    const { toastNotifications, savedObjectsClient, application, uiSettings } = getServices();

    if (!isDataSourceEnabled) {
      return null;
    }

    if (useUpdatedUX) {
      return (
        <MountPointPortal
          setMountPoint={this.props.opensearchDashboards.services.setHeaderActionMenu}
        >
          <DataSourceMenu
            componentType="DataSourceSelectable"
            componentConfig={{
              notifications: toastNotifications,
              savedObjects: savedObjectsClient,
              onSelectedDataSources: this.onSelectedDataSourceChange,
            }}
            application={application}
            hideLocalCluster={isLocalClusterHidden}
            uiSettings={uiSettings}
          />
        </MountPointPortal>
      );
    }
    return (
      <div className="sampleDataSourceSelector">
        <DataSourceSelector
          savedObjectsClient={savedObjectsClient}
          notifications={toastNotifications}
          onSelectedDataSource={this.onSelectedDataSourceChange}
          disabled={!isDataSourceEnabled}
          hideLocalCluster={isLocalClusterHidden}
          uiSettings={uiSettings}
          compressed={true}
        />
      </div>
    );
  };

  renderNotices = () => {
    const notices = getServices().tutorialService.getDirectoryNotices();
    return notices.length ? (
      <EuiFlexGroup direction="column" gutterSize="none">
        {notices.map((DirectoryNotice, index) => (
          <EuiFlexItem key={index}>
            <DirectoryNotice />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    ) : null;
  };

  renderHeaderLinks = () => {
    const headerLinks = getServices().tutorialService.getDirectoryHeaderLinks();
    return headerLinks.length ? (
      <EuiFlexGroup gutterSize="m" alignItems="center">
        {headerLinks.map((HeaderLink, index) => (
          <EuiFlexItem key={index}>
            <HeaderLink />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    ) : null;
  };

  renderHeader = () => {
    const notices = this.renderNotices();
    const headerLinks = this.renderHeaderLinks();
    const { application } = getServices();
    const {
      navigation: {
        ui: { HeaderControl },
      },
    } = this.props.opensearchDashboards.services;

    if (this.state.useUpdatedUX) {
      return (
        <HeaderControl
          controls={[
            {
              description: this.props.intl.formatMessage({
                id: 'home.tutorial.card.sampleDataDescription',
                defaultMessage: 'Explore sample data, visualizations, and dashboards.',
              }),
            },
          ]}
          setMountPoint={application.setAppDescriptionControls}
        />
      );
    }

    return (
      <>
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem>
            <EuiText size="s">
              <h1>
                <FormattedMessage
                  id="home.tutorial.addDataToOpenSearchDashboardsTitle"
                  defaultMessage="Add sample data"
                />
              </h1>
            </EuiText>
          </EuiFlexItem>
          {headerLinks ? <EuiFlexItem grow={false}>{headerLinks}</EuiFlexItem> : null}
        </EuiFlexGroup>
        {notices}
      </>
    );
  };

  renderPageBody = () => {
    const { useUpdatedUX } = this.state;
    return (
      <EuiPageBody component="main">
        {this.renderHeader()}
        {!useUpdatedUX && <EuiSpacer size="m" />}
        {this.renderDataSourceSelector()}
        <EuiTabs size="s">{this.renderTabs()}</EuiTabs>
        <EuiSpacer size={useUpdatedUX ? 's' : undefined} />
        {this.renderTabContent()}
      </EuiPageBody>
    );
  };

  render() {
    const { isDataSourceEnabled, useUpdatedUX } = this.state;

    if (useUpdatedUX) {
      return (
        <EuiPage>
          <EuiPanel paddingSize="m">{this.renderPageBody()}</EuiPanel>
        </EuiPage>
      );
    }
    return isDataSourceEnabled ? (
      <EuiPanel paddingSize={'l'} style={{ width: '70%', margin: '50px auto' }}>
        {this.renderPageBody()}
      </EuiPanel>
    ) : (
      <EuiPage restrictWidth={1200}>{this.renderPageBody()}</EuiPage>
    );
  }
}

TutorialDirectoryUi.propTypes = {
  addBasePath: PropTypes.func.isRequired,
  openTab: PropTypes.string,
  isCloudEnabled: PropTypes.bool.isRequired,
  withoutHomeBreadCrumb: PropTypes.bool,
  openSearchDashboards: PropTypes.object,
};

export const TutorialDirectory = injectI18n(withOpenSearchDashboards(TutorialDirectoryUi));
