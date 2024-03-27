/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCard,
  EuiImage,
  EuiTitle,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Section } from '../../../../services/section_type/section_type';
import { renderFn } from './utils';
import { getServices } from '../../../opensearch_dashboards_services';

const render = renderFn(() => {
  const [isExpanded, setExpanded] = useState(true);
  const toggleExpanded = () => setExpanded((expanded) => !expanded);
  const services = getServices();
  const navigateToApp = services.application.navigateToApp;
  const navigateToUrl = services.application.navigateToUrl;
  const darkMode = services.injectedMetadata.getBranding().darkMode;

  const content = (
    <EuiFlexGroup wrap direction="row" alignItems="stretch">
      <EuiFlexItem>
        <EuiCard
          title={i18n.translate('home.sections.workWithData.sampleData.title', {
            defaultMessage: 'Start with a sample data set',
          })}
          titleSize="xs"
          textAlign="left"
          description={i18n.translate('home.sections.workWithData.sampleData.description', {
            defaultMessage: 'with Sample Data Sets',
          })}
          onClick={() => navigateToApp('home', { path: '#/tutorial_directory' })}
          image={
            <EuiImage
              src={services.addBasePath(
                `/plugins/home/assets/sample_data_resources/ecommerce/${
                  darkMode ? 'dashboard_dark_new.png' : 'dashboard_new.png'
                }`
              )}
              alt="Sample data image"
            />
          }
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiCard
          title={i18n.translate('home.sections.workWithData.ingest.title', {
            defaultMessage: 'Prepare and ingest data',
          })}
          titleSize="xs"
          textAlign="left"
          description={i18n.translate('home.sections.workWithData.ingest.description', {
            defaultMessage: 'with Data Prepper',
          })}
          onClick={() => navigateToUrl('https://opensearch.org/docs/latest/data-prepper/')}
          image={
            <EuiImage
              src={services.addBasePath(`/plugins/home/assets/ingestion.png`)}
              alt="Injestion image"
            />
          }
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiCard
          title={i18n.translate('home.sections.workWithData.discover.title', {
            defaultMessage: 'Query and filter data for in-depth analysis',
          })}
          titleSize="xs"
          textAlign="left"
          description={i18n.translate('home.sections.workWithData.discover.description', {
            defaultMessage: 'with Discover',
          })}
          onClick={() => navigateToApp('discover')}
          image={
            <EuiImage
              src={services.addBasePath(
                `/plugins/home/assets/${darkMode ? 'discover_dark.png' : 'discover_light.png'}`
              )}
              alt="Explore image"
            />
          }
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <>
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow>
          <EuiTitle size="m">
            <h2>
              {i18n.translate('home.sections.workWithData.title', {
                defaultMessage: 'Start working with data',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            onClick={toggleExpanded}
            size="s"
            iconSize="m"
            color="text"
            aria-label={
              isExpanded
                ? i18n.translate('home.section.collapse', { defaultMessage: 'Collapse section' })
                : i18n.translate('home.section.expand', { defaultMessage: 'Expand section' })
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {isExpanded && content}
    </>
  );
});

export const workWithDataSection: Section = {
  id: 'home:workWithData',
  title: i18n.translate('home.sections.workWithData.title', {
    defaultMessage: 'Start working with data',
  }),
  render,
};
