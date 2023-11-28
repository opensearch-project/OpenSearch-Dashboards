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
  EuiButtonIcon,
} from '@elastic/eui';
import { HeroSection } from './hero_section';
import illustration from '../../../../assets/illustration.svg';
import { getServices } from '../../../opensearch_dashboards_services';
import screenshot from '../../../../assets/screenshot.png';

export const GetStartedSection: React.FC<{ olly?: boolean }> = ({ olly = true }) => {
  const services = getServices();
  const getUrl = services.application.getUrlForApp;
  const navigate = services.application.navigateToApp;
  const logos = services.chrome.logos;
  const heroConfig = services.homeConfig.hero;
  const isHeroEnabled = heroConfig.enabled;
  const prompts = isHeroEnabled ? heroConfig.prompts : [];
  type Prompt = typeof prompts extends Array<infer T> ? T : never;

  const description = (
    <FormattedMessage
      id="home.getStarted.playgroundDescription"
      defaultMessage={heroConfig.body}
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

  const actionButton = !heroConfig.externalActionButton ? (
    <EuiButton
      fullWidth={false}
      fill
      href={getUrl(heroConfig.actionButton.app, { path: heroConfig.actionButton.path })}
    >
      <FormattedMessage
        id="home.getStarted.launchTutorial"
        defaultMessage={heroConfig.actionButton.text}
      />
    </EuiButton>
  ) : (
    <EuiButton fullWidth={false} fill href={heroConfig.externalActionButton.link}>
      <FormattedMessage
        id="home.getStarted.login"
        defaultMessage={heroConfig.externalActionButton.text}
      />
    </EuiButton>
  );

  const content = olly ? (
    renderCategories()
  ) : (
    <EuiImage src={illustration} alt="illustration" size="fullWidth" />
  );

  function renderExample({ text, app, path }: Prompt) {
    return (
      <EuiFlexItem key={text} grow={false}>
        <EuiPanel
          color="subdued"
          paddingSize="s"
          onClick={() =>
            navigate(app, {
              path,
            })
          }
        >
          <EuiFlexGroup direction="row" responsive={false} alignItems="flexStart" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiIcon type={logos.Chat.url} size="l" />
            </EuiFlexItem>
            <EuiFlexItem>&quot;{text}&quot;</EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    );
  }

  function renderCategories() {
    return (
      <>
        <EuiTitle size="s">
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

  const links = [
    {
      text: i18n.translate('home.getStarted.learnMore', {
        defaultMessage: heroConfig.secondaryButton.text,
      }),
      url: heroConfig.secondaryButton.link,
    },
  ];

  // TODO: understand why we only want this for Olly
  if (olly) {
    links.push({
      text: i18n.translate('home.getStarted.stayConnected', { defaultMessage: 'Stay connected' }),
      url: 'https://opensearch.org/slack.html',
    });
  }

  return (
    <HeroSection
      title={i18n.translate('home.getStarted.title', {
        defaultMessage: heroConfig.title,
      })}
      description={description}
      links={links}
      actionButton={actionButton}
      content={content}
      illustration={
        heroConfig.img ? (
          <div className="home-hero-illustrationContainer">
            <EuiButtonIcon
              target="_blank"
              rel="noopener noreferrer"
              href={heroConfig.img.link}
              aria-labelledby="home-hero-illustrationPlay"
              className="home-hero-illustrationButton"
              display="fill"
              iconType="play"
              iconSize="l"
              size="m"
            />
            <EuiImage src={screenshot} alt="Animated gif 16:9 ratio" />
          </div>
        ) : (
          <EuiImage src={screenshot} alt="Animated gif 16:9 ratio" />
        )
      }
    />
  );
};
