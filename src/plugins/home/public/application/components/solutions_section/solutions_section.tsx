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

import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiScreenReaderOnly } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { Logos } from 'opensearch-dashboards/public';
import { SolutionPanel } from './solution_panel';
import { HomePluginBranding } from '../../../plugin';
import { FeatureCatalogueEntry, FeatureCatalogueSolution } from '../../../';

const sortByOrder = (
  { order: orderA = 0 }: FeatureCatalogueSolution | FeatureCatalogueEntry,
  { order: orderB = 0 }: FeatureCatalogueSolution | FeatureCatalogueEntry
) => orderA - orderB;

interface Props {
  addBasePath: (path: string) => string;
  solutions: FeatureCatalogueSolution[];
  directories: FeatureCatalogueEntry[];
  branding: HomePluginBranding;
  logos: Logos;
}

export const SolutionsSection: FC<Props> = ({
  addBasePath,
  solutions,
  directories,
  branding,
  logos,
}) => {
  // Separate OpenSearch Dashboards from other solutions
  const opensearchDashboards = solutions.find(({ id }) => id === 'opensearchDashboards');
  const opensearchDashboardsApps = directories
    .filter(({ solutionId }) => solutionId === 'opensearchDashboards')
    .sort(sortByOrder);
  solutions = solutions.sort(sortByOrder).filter(({ id }) => id !== 'opensearchDashboards');

  return (
    <>
      <section aria-labelledby="homSolutions__title" className="homSolutions">
        <EuiScreenReaderOnly>
          <h2 id="homSolutions__title">
            <FormattedMessage
              id="home.solutionsSection.sectionTitle"
              defaultMessage="Pick your solution"
            />
          </h2>
        </EuiScreenReaderOnly>

        <EuiFlexGroup className="homSolutions__content" justifyContent="spaceAround">
          {solutions.length ? (
            <EuiFlexItem grow={1} className="homSolutions__group homSolutions__group--multiple">
              <EuiFlexGroup direction="column">
                {solutions.map((solution) => (
                  <SolutionPanel
                    key={solution.id}
                    solution={solution}
                    addBasePath={addBasePath}
                    branding={branding}
                    logos={logos}
                  />
                ))}
              </EuiFlexGroup>
            </EuiFlexItem>
          ) : null}
          {opensearchDashboards ? (
            <SolutionPanel
              solution={opensearchDashboards}
              addBasePath={addBasePath}
              apps={opensearchDashboardsApps.length ? opensearchDashboardsApps : undefined}
              branding={branding}
              logos={logos}
            />
          ) : null}
        </EuiFlexGroup>
      </section>

      <EuiHorizontalRule margin="xl" aria-hidden="true" />
    </>
  );
};

SolutionsSection.propTypes = {
  addBasePath: PropTypes.func.isRequired,
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
