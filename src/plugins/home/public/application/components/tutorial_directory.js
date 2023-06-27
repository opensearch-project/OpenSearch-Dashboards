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
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { getDataSources } from '../../../../data_source_management/public/components/utils';

import {
  EuiPage,
  EuiPanel,
  EuiTabs,
  EuiTab,
  EuiFlexItem,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiSpacer,
  EuiTitle,
  EuiPageBody,
  EuiComboBox,
} from '@elastic/eui';

import { getTutorials } from '../load_tutorials';
import { injectI18n, FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

const ALL_TAB_ID = 'all';
const SAMPLE_DATA_TAB_ID = 'sampleData';

const homeTitle = i18n.translate('home.breadcrumbs.homeTitle', { defaultMessage: 'Home' });
const addDataTitle = i18n.translate('home.breadcrumbs.addDataTitle', {
  defaultMessage: 'Add data',
});
const localCluster = i18n.translate('home.dataSource.localCluster', {
  defaultMessage: 'Local Cluster',
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
      selectedOption: [{ label: localCluster }],
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;

    getServices().chrome.setBreadcrumbs([
      {
        text: homeTitle,
        href: '#/',
      },
      { text: addDataTitle },
    ]);

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

    if (this.state.isDataSourceEnabled) {
      getDataSources(getServices().savedObjectsClient)
        .then((fetchedDataSources) => {
          if (fetchedDataSources?.length) {
            const dataSourceOptions = fetchedDataSources.map((dataSource) => ({
              id: dataSource.id,
              label: dataSource.title,
            }));

            dataSourceOptions.push({ label: localCluster });
            this.setState({
              // eslint-disable-line react/no-did-mount-set-state
              dataSources: dataSourceOptions,
            });
          }
        })
        .catch(() => {
          getServices().toastNotifications.addWarning(
            i18n.translate('home.dataSource.fetchDataSourceError', {
              defaultMessage: 'Unable to fetch existing data sources',
            })
          );
        });
    }

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

  onSelectedDataSourceChange = (e) => {
    this.setState({ selectedOption: e });
    const dataSourceId = e[0] ? e[0].id : undefined;
    this.setState({ selectedDataSourceId: dataSourceId });
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

  renderDataSourceSelector = () => {
    const { isDataSourceEnabled, dataSources, selectedOption } = this.state;

    return isDataSourceEnabled ? (
      <div className="sampledataSourcePicker">
        <EuiComboBox
          aria-label={i18n.translate('sampleData.DataSourceComboBoxAriaLabel', {
            defaultMessage: 'Select a Data Source',
          })}
          placeholder={i18n.translate('sampleData.DataSourceComboBoxPlaceholder', {
            defaultMessage: 'Select a Data Source',
          })}
          singleSelection={{ asPlainText: true }}
          options={dataSources}
          selectedOptions={selectedOption}
          onChange={this.onSelectedDataSourceChange}
          prepend="DataSource"
          compressed
          isDisabled={!isDataSourceEnabled}
        />
      </div>
    ) : null;
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

    return (
      <>
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem>
            <EuiTitle size="l">
              <h1>
                <FormattedMessage
                  id="home.tutorial.addDataToOpenSearchDashboardsTitle"
                  defaultMessage="Add sample data"
                />
              </h1>
            </EuiTitle>
          </EuiFlexItem>
          {headerLinks ? <EuiFlexItem grow={false}>{headerLinks}</EuiFlexItem> : null}
        </EuiFlexGroup>
        {notices}
      </>
    );
  };

  renderPageBody = () => {
    return (
      <EuiPageBody component="main">
        {this.renderHeader()}
        <EuiSpacer size="m" />
        {this.renderDataSourceSelector()}
        <EuiTabs>{this.renderTabs()}</EuiTabs>
        <EuiSpacer />
        {this.renderTabContent()}
      </EuiPageBody>
    );
  };

  render() {
    const { isDataSourceEnabled } = this.state;

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
};

export const TutorialDirectory = injectI18n(TutorialDirectoryUi);
