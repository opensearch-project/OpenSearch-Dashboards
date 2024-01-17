/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FC, PropsWithChildren } from 'react';
import { useMount } from 'react-use';
import { Subscription } from 'rxjs';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiPageTemplate, EuiButtonEmpty, EuiHorizontalRule } from '@elastic/eui';
import {
  HeroSection as HeroSectionType,
  Section as SectionType,
} from '../../../services/section_type/section_type';
import { getServices } from '../../opensearch_dashboards_services';
import { HeroSection } from './hero_section';
import { Section } from './section';
import { Footer } from './footer';

const useHomepage = () => {
  const { sectionTypes } = getServices();
  const [heroes, setHeroes] = useState<HeroSectionType[]>();
  const [sections, setSections] = useState<SectionType[]>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    const homepage = sectionTypes.getHomepage();

    const subscriptions = new Subscription();
    subscriptions.add(homepage.heroes$.subscribe(setHeroes));
    subscriptions.add(homepage.sections$.subscribe(setSections));
    subscriptions.add(homepage.error$.subscribe(setError));

    return () => {
      subscriptions.unsubscribe();
      homepage.cleanup();
    };
  }, [sectionTypes]);

  const isLoading = !heroes && !sections;

  return { heroes, sections, error, isLoading };
};

const Layout: FC<PropsWithChildren<{}>> = ({ children }) => {
  const {
    application: { getUrlForApp },
    chrome,
  } = getServices();

  useMount(() => {
    chrome.setBreadcrumbs([
      {
        text: i18n.translate('home.breadcrumbs.homeTitle', { defaultMessage: 'Home' }),
      },
    ]);
  });

  // TODO: this ends up being reversed on the page, so we reverse the array here. There is a performance cost to this, so todo manually reverse it
  const sideItems: React.ReactNode[] = [
    <EuiButtonEmpty
      iconType="indexOpen"
      href={getUrlForApp('home', { path: '#/tutorial_directory' })}
    >
      <FormattedMessage id="home.addData" defaultMessage="Add data" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="gear" href={getUrlForApp('management')}>
      <FormattedMessage id="home.manage" defaultMessage="Manage" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="wrench" href={getUrlForApp('dev_tools', { path: '#/console' })}>
      <FormattedMessage id="home.devTools" defaultMessage="Dev tools" />
    </EuiButtonEmpty>,
  ].reverse();

  return (
    <EuiPageTemplate
      restrictWidth={1400}
      pageHeader={{
        pageTitle: i18n.translate('home.title', { defaultMessage: 'Home' }),
        rightSideItems: sideItems,
        alignItems: 'center',
      }}
      pageContentProps={{
        color: 'transparent',
        hasBorder: false,
        hasShadow: false,
      }}
      pageContentBodyProps={{
        paddingSize: 'none',
        className: 'home-homepage-pageBody',
      }}
    >
      {children}
    </EuiPageTemplate>
  );
};

export const Homepage = () => {
  const { heroes, sections, error, isLoading } = useHomepage();

  if (error) {
    // TODO: what is the correct way to handle errors here?
    // eslint-disable-next-line no-console
    console.error(error);

    return <span>Error loading homepage</span>;
  }

  if (isLoading) {
    return <span>Loading...</span>;
  }

  const hero = heroes?.[0];

  return (
    <Layout>
      {hero && <HeroSection render={hero.render} />}
      {sections?.map(({ render, title, description, links }, i) => (
        <Section key={i} title={title} description={description} links={links} render={render} />
      ))}
      <EuiHorizontalRule />
      <Footer />
    </Layout>
  );
};
