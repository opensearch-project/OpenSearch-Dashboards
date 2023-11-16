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
  EuiButton,
  EuiTitle,
  EuiImage,
  EuiLink,
  EuiIcon,
} from '@elastic/eui';
import { HeroSection } from './hero_section';
import illustration from '../../../../assets/illustration.svg';
import { getServices } from '../../../opensearch_dashboards_services';
import logo from '../../../../assets/logos/chat.svg';

export const GetStartedSection: React.FC<{ olly?: boolean }> = ({ olly = true }) => {
  const services = getServices();
  const getUrl = services.application.getUrlForApp;
  const navigate = services.application.navigateToApp;
  const prompts = services.homeConfig.prompts;
  type Prompt = typeof prompts extends Array<infer T> ? T : never;

  const OLLY_DESCRIPTION = (
    <FormattedMessage
      id="home.getStarted.ollyDescription"
      defaultMessage="Automatically generate complex queries using simple natural language questions. AI assisted summaraies help you navigate and understand your log data."
    />
  );

  const PLAYGROUND_DESCRIPTION = (
    <FormattedMessage
      id="home.getStarted.playgroundDescription"
      defaultMessage="Automatically generate complex queries using simple conversational prompts. AI assisted summary helps you navigate and understand errors from your logs.{br}{br}You will be redirected to the observability playground where you will need to login. All the {terms} of the playground still apply."
      values={{
        br: <br />,
        terms: (
          <EuiLink href="https://opensearch.org/terms-of-use/">
            <FormattedMessage id="home.getStarted.terms" defaultMessage="terms of use" />
          </EuiLink>
        ),
      }}
    />
  );

  const description = olly ? OLLY_DESCRIPTION : PLAYGROUND_DESCRIPTION;

  const OLLY_ACTION_BUTTON = (
    <EuiButton fullWidth={false} fill href={getUrl('observability-logs', { path: '#/explorer' })}>
      <FormattedMessage id="home.getStarted.launchTutorial" defaultMessage="Try in Log Explorer" />
    </EuiButton>
  );

  const PLAYGROUND_ACTION_BUTTON = (
    <EuiButton fullWidth={false} fill href="https://observability.playground.opensearch.org/">
      <FormattedMessage id="home.getStarted.login" defaultMessage="Login to try" />
    </EuiButton>
  );

  const actionButton = olly ? OLLY_ACTION_BUTTON : PLAYGROUND_ACTION_BUTTON;

  function renderExample({ prompt, datasourceName, datasourceType, indexPattern }: Prompt) {
    return (
      <EuiFlexItem key={prompt} grow={false}>
        <EuiPanel
          color="subdued"
          onClick={() =>
            navigate('observability-logs', {
              path: `#/explorer?datasourceName=${encodeURIComponent(
                datasourceName
              )}&datasourceType=${encodeURIComponent(
                datasourceType
              )}&indexPattern=${encodeURIComponent(indexPattern)}&olly_q=${encodeURIComponent(
                prompt
              )}`,
            })
          }
        >
          <EuiFlexGroup direction="row" responsive={false} alignItems="flexStart" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiIcon type={logo} size="l" />
            </EuiFlexItem>
            <EuiFlexItem>&quot;{prompt}&quot;</EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    );
  }

  function renderCategories() {
    return (
      <>
        <EuiTitle size="m">
          <h3>
            <FormattedMessage id="home.getStarted.examples" defaultMessage="Suggested questions" />
          </h3>
        </EuiTitle>
        <EuiFlexGroup direction="column" gutterSize="s">
          {prompts.map((prompt) => renderExample(prompt))}
        </EuiFlexGroup>
      </>
    );
  }

  return (
    <HeroSection
      title={i18n.translate('home.getStarted.title', {
        defaultMessage: 'Try the Query Assistant',
      })}
      description={description}
      link={{
        text: i18n.translate('home.getStarted.learnMore', { defaultMessage: 'Learn more' }),
        url: 'https://opensearch.org/platform/observability/index.html',
      }}
      actionButton={actionButton}
      content={
        olly ? (
          renderCategories()
        ) : (
          <EuiImage src={illustration} alt="illustration" size="fullWidth" />
        )
      }
      illustration={<EuiImage src="https://placehold.co/1920x1080" alt="Animated gif 16:9 ratio" />}
    />
  );
};
