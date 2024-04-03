/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiTitle,
  EuiImage,
  EuiLink,
  EuiButtonIcon,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import illustration from '../../../../assets/illustration.svg';
import { getServices } from '../../../opensearch_dashboards_services';
import { renderFn } from './utils';

// TODO: This is hardcoded for the playground. Do not use long term
const DEFAULT_HERO_DATA = {
  title: 'Try the Query Assistant',
  body:
    'Automatically generate complex queries using simple conversational prompts. AI assisted summary helps you navigate and understand errors from your logs.{br}{br}You will be redirected to the AI playground where you will need to login. All the {terms} of the playground still apply.',
  externalActionButton: {
    text: 'Login to try',
    link: 'https://ai.playground.opensearch.org/',
  },
  img: {
    link: 'https://www.youtube.com/watch?v=VTiJtGI2Sr4',
  },
  secondaryButton: {
    text: 'Learn more',
    link: 'https://opensearch.org/blog/opensearch-adds-new-generative-ai-assistant-toolkit/',
  },
};

export const GetStartedSection: React.FC = () => {
  const services = getServices();
  const addBasePath = services.http.basePath.prepend;
  const heroConfig = DEFAULT_HERO_DATA;

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

  const actionButton = (
    <EuiButton fullWidth={false} fill href={heroConfig.externalActionButton.link}>
      <FormattedMessage
        id="home.getStarted.login"
        defaultMessage={heroConfig.externalActionButton.text}
      />
    </EuiButton>
  );

  const illustrationPanel = heroConfig.img ? (
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
      <EuiImage src={getIllustrationImage()} alt="getting started preview" />
    </div>
  ) : (
    <EuiImage src={getIllustrationImage()} alt="getting started preview" />
  );

  function getIllustrationImage() {
    return addBasePath('/plugins/home/assets/screenshot.png');
  }

  const links = [
    {
      text: i18n.translate('home.getStarted.learnMore', {
        defaultMessage: heroConfig.secondaryButton.text,
      }),
      url: heroConfig.secondaryButton.link,
    },
  ];

  return (
    <HeroSection
      title={i18n.translate('home.getStarted.title', {
        defaultMessage: heroConfig.title,
      })}
      description={description}
      links={links}
      actionButton={actionButton}
      content={<EuiImage src={illustration} alt="illustration" size="fullWidth" />}
      illustrationEle={illustrationPanel}
    />
  );
};

interface HeroSectionProps {
  title: string;
  description: React.ReactNode;
  links: Array<{
    text: string;
    url: string;
  }>;
  actionButton: React.ReactNode;
  content: React.ReactNode;
  illustrationEle: React.ReactNode;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  description,
  links,
  actionButton,
  content,
  illustrationEle,
}) => {
  return (
    <EuiFlexGroup direction="row" alignItems="flexStart" className="home-hero-group">
      <EuiFlexItem grow={10}>{illustrationEle}</EuiFlexItem>
      <EuiFlexItem grow={9} className="home-hero-descriptionSection">
        <EuiTitle size="m" className="home-hero-title">
          <h2>{title}</h2>
        </EuiTitle>
        <EuiText>{description}</EuiText>
        <EuiSpacer size="m" />
        {actionButton}
        <EuiSpacer size="m" />
        <EuiFlexGroup direction="row" responsive={false} gutterSize="l">
          {links.map((link) => (
            <EuiFlexItem grow={false} key={link.url}>
              <EuiLink href={link.url} external={true}>
                {link.text}
              </EuiLink>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={10}>{content}</EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const render = renderFn(() => {
  return <GetStartedSection />;
});

export const heroSection = {
  id: 'home:query-assist',
  render,
};
