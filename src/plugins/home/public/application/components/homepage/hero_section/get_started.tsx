/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiIcon,
  EuiButton,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { HeroSection } from './hero_section';

export const GetStartedSection: React.FC = () => {
  function renderOptions(options1: string[], options2?: string[]) {
    return (
      <EuiFlexGroup wrap direction="row" gutterSize="s">
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            {options1.map((option, i) => (
              <EuiFlexItem key={i} grow={false}>
                <EuiPanel color="subdued">&quot;{option}&quot;</EuiPanel>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
        {options2 && (
          <EuiFlexItem>
            <EuiFlexGroup direction="column" gutterSize="s">
              {options2.map((option, i) => (
                <EuiFlexItem key={i} grow={false}>
                  <EuiPanel color="subdued">&quot;{option}&quot;</EuiPanel>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }

  function renderCategory(size: 1 | 2, title: string, options1: string[], options2?: string[]) {
    return (
      <EuiFlexItem grow={size}>
        <EuiTitle size="m">
          <h3>{title}</h3>
        </EuiTitle>
        {renderOptions(options1, options2)}
      </EuiFlexItem>
    );
  }

  function renderCategories() {
    return (
      <>
        <EuiFlexGroup wrap direction="row">
          {renderCategory(
            2,
            i18n.translate('home.getStarted.observability', { defaultMessage: 'Observability' }),
            [
              i18n.translate('home.getStarted.monitor', {
                defaultMessage: 'Help me optimize the observability deployment for my new service',
              }),
              i18n.translate('home.getStarted.import', {
                defaultMessage: 'Help me investigate a service incident',
              }),
            ],
            [
              i18n.translate('home.getStarted.question', {
                defaultMessage: 'Help me understand why my service latency increased this week?',
              }),
              i18n.translate('home.getStarted.question2', {
                defaultMessage: 'How are my service level indicators?',
              }),
            ]
          )}
          {renderCategory(
            1,
            i18n.translate('home.getStarted.more', { defaultMessage: 'General' }),
            [
              i18n.translate('home.getStarted.ingest', {
                defaultMessage: 'Help me understand the indexes in my system',
              }),
              i18n.translate('home.getStarted.visualize', {
                defaultMessage: 'Help me optimize my OpenSearch setup',
              }),
            ]
          )}
        </EuiFlexGroup>
        <EuiSpacer />
        {renderFooter()}
      </>
    );
  }

  function renderFooter() {
    return (
      <EuiPanel color="subdued">
        <EuiFlexGroup wrap direction="row" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiIcon type="chatRight" size="l" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="row" alignItems="center">
              <EuiFlexItem>
                <EuiFieldText
                  fullWidth
                  placeholder={i18n.translate('home.getStarted.placeholder', {
                    defaultMessage: 'Ask anything',
                  })}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton size="s" iconSide="right" iconType="returnKey" fill={true} minWidth={0}>
                  <FormattedMessage id="home.getStarted.go" defaultMessage="Go" />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  return (
    <HeroSection
      title={i18n.translate('home.getStarted.title', { defaultMessage: 'Get started' })}
      description={i18n.translate('home.getStarted.description', {
        defaultMessage:
          'Explore OpenSearch capabilities with the OpenSearch Assistant. Start with a suggested prompt, or ask anything.',
      })}
      links={[
        {
          text: i18n.translate('home.getStarted.learnMore', { defaultMessage: 'Learn more' }),
          url: 'https://google.com',
        },
      ]}
      categories={renderCategories()}
    />
  );
};
