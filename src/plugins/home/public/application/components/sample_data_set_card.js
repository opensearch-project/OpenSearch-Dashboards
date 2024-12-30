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
import useObservable from 'react-use/lib/useObservable';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
} from '@elastic/eui';

export const INSTALLED_STATUS = 'installed';
export const UNINSTALLED_STATUS = 'not_installed';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

import { SampleDataViewDataButton } from './sample_data_view_data_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

export const SampleDataSetCard = (props) => {
  const {
    services: { workspaces },
  } = useOpenSearchDashboards();
  const isInstalled = props.status === INSTALLED_STATUS;
  const currentWorkspace = useObservable(workspaces.currentWorkspace$);
  const isReadOnly = !!(currentWorkspace && currentWorkspace.readonly);

  const install = () => {
    props.onInstall(props.id, props.dataSourceId);
  };

  const uninstall = () => {
    props.onUninstall(props.id, props.dataSourceId);
  };

  const renderBtn = () => {
    const dataSourceEnabled = props.isDataSourceEnabled;
    const hideLocalCluster = props.isLocalClusterHidden;
    const dataSourceId = props.dataSourceId;

    let buttonDisabled = false;
    if (dataSourceEnabled && hideLocalCluster) {
      buttonDisabled = dataSourceId === undefined;
    }

    switch (props.status) {
      case INSTALLED_STATUS:
        return (
          <EuiFlexGroup gutterSize="none" justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty
                isDisabled={isReadOnly}
                isLoading={props.isProcessing}
                onClick={uninstall}
                color="danger"
                data-test-subj={`removeSampleDataSet${props.id}`}
                flush="left"
                aria-label={
                  props.isProcessing
                    ? i18n.translate('home.sampleDataSetCard.removingButtonAriaLabel', {
                        defaultMessage: 'Removing {datasetName}',
                        values: {
                          datasetName: props.name,
                        },
                      })
                    : i18n.translate('home.sampleDataSetCard.removeButtonAriaLabel', {
                        defaultMessage: 'Remove {datasetName}',
                        values: {
                          datasetName: props.name,
                        },
                      })
                }
              >
                {props.isProcessing ? (
                  <FormattedMessage
                    id="home.sampleDataSetCard.removingButtonLabel"
                    defaultMessage="Removing"
                  />
                ) : (
                  <FormattedMessage
                    id="home.sampleDataSetCard.removeButtonLabel"
                    defaultMessage="Remove"
                  />
                )}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <SampleDataViewDataButton
                id={props.id}
                dataSourceId={props.dataSourceId}
                name={props.name}
                overviewDashboard={props.overviewDashboard}
                appLinks={props.appLinks}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        );

      case UNINSTALLED_STATUS:
        return (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                isDisabled={buttonDisabled || isReadOnly}
                isLoading={props.isProcessing}
                onClick={install}
                data-test-subj={`addSampleDataSet${props.id}`}
                aria-label={
                  props.isProcessing
                    ? i18n.translate('home.sampleDataSetCard.addingButtonAriaLabel', {
                        defaultMessage: 'Adding {datasetName}',
                        values: {
                          datasetName: props.name,
                        },
                      })
                    : i18n.translate('home.sampleDataSetCard.addButtonAriaLabel', {
                        defaultMessage: 'Add {datasetName}',
                        values: {
                          datasetName: props.name,
                        },
                      })
                }
              >
                {props.isProcessing ? (
                  <FormattedMessage
                    id="home.sampleDataSetCard.addingButtonLabel"
                    defaultMessage="Adding"
                  />
                ) : (
                  <FormattedMessage
                    id="home.sampleDataSetCard.addButtonLabel"
                    defaultMessage="Add data"
                  />
                )}
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        );

      default: {
        return (
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiToolTip
                position="top"
                content={
                  <p>
                    <FormattedMessage
                      id="home.sampleDataSetCard.default.unableToVerifyErrorMessage"
                      defaultMessage="Unable to verify dataset status, error: {statusMsg}"
                      values={{ statusMsg: props.statusMsg }}
                    />
                  </p>
                }
              >
                <EuiSmallButton
                  isDisabled={buttonDisabled || isReadOnly}
                  data-test-subj={`addSampleDataSet${props.id}`}
                  aria-label={i18n.translate('home.sampleDataSetCard.default.addButtonAriaLabel', {
                    defaultMessage: 'Add {datasetName}',
                    values: {
                      datasetName: props.name,
                    },
                  })}
                >
                  <FormattedMessage
                    id="home.sampleDataSetCard.default.addButtonLabel"
                    defaultMessage="Add data"
                  />
                </EuiSmallButton>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      }
    }
  };

  return (
    <EuiCard
      textAlign="left"
      className="homSampleDataSetCard"
      image={props.previewUrl}
      title={props.name}
      description={props.description}
      betaBadgeLabel={isInstalled ? 'INSTALLED' : null}
      footer={renderBtn()}
      data-test-subj={`sampleDataSetCard${props.id}`}
    />
  );
};

SampleDataSetCard.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  overviewDashboard: PropTypes.string.isRequired,
  appLinks: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ).isRequired,
  status: PropTypes.oneOf([INSTALLED_STATUS, UNINSTALLED_STATUS, 'unknown']).isRequired,
  isProcessing: PropTypes.bool.isRequired,
  statusMsg: PropTypes.string,
  previewUrl: PropTypes.string.isRequired,
  onInstall: PropTypes.func.isRequired,
  onUninstall: PropTypes.func.isRequired,
};
