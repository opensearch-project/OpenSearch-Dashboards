/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMount } from 'react-use';
import { Subscription } from 'rxjs';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiPageTemplate,
  EuiButtonEmpty,
  EuiHorizontalRule,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiIcon,
} from '@elastic/eui';
import {
  HeroSection as HeroSectionType,
  Section as SectionType,
} from '../../../services/section_type/section_type';
import { getServices } from '../../opensearch_dashboards_services';
import { HeroSection } from './hero_section';
import { Section } from './section';
import { Footer } from './footer';
import { Welcome } from '../welcome';

const KEY_ENABLE_WELCOME = 'home:welcome:show';

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

const useShowWelcome = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isNewInstance, setIsNewInstance] = useState(false);
  const { homeConfig, savedObjectsClient } = getServices();

  const [isWelcomeEnabled, setIsWelcomeEnabled] = useState(
    !(homeConfig.disableWelcomeScreen || localStorage.getItem(KEY_ENABLE_WELCOME) === 'false')
  );

  useEffect(() => {
    if (!isWelcomeEnabled) {
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setIsWelcomeEnabled(false);
    }, 500);

    savedObjectsClient
      .find({
        type: 'index-pattern',
        fields: ['title'],
        search: `*`,
        searchFields: ['title'],
        perPage: 1,
      })
      .then((resp) => {
        setIsLoading(false);
        setIsNewInstance(resp.total === 0);

        clearTimeout(timeout);
      });

    return () => {
      clearTimeout(timeout);
    };
  }, [isWelcomeEnabled, savedObjectsClient]);

  return {
    isLoading,
    showWelcome: isWelcomeEnabled && isNewInstance,
    onSkip: () => {
      localStorage.setItem(KEY_ENABLE_WELCOME, 'false');
      setIsWelcomeEnabled(false);
    },
  };
};

const Content = () => {
  const { heroes, sections, error, isLoading: isHomepageLoading } = useHomepage();
  const {
    chrome: { logos },
    getBasePath,
    injectedMetadata: { getBranding },
    telemetry,
    toastNotifications,
  } = getServices();
  const { isLoading: isWelcomeLoading, showWelcome, onSkip } = useShowWelcome();

  useEffect(() => {
    if (!error) {
      return;
    }

    toastNotifications.addDanger({
      title: i18n.translate('home.loadingError.title', {
        defaultMessage: 'Error loading homepage',
      }),
      text: i18n.translate('home.loadingError.description', {
        defaultMessage:
          'There was an error loading the homepage. Please refresh the page to try again.',
      }),
    });

    // TODO: added a toast, but is there a better way to surface this error?
    // eslint-disable-next-line no-console
    console.error(error);
  }, [toastNotifications, error]);

  if (error) {
    return (
      <EuiFlexGroup
        className="home-homepage-body--fill"
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <EuiFlexItem grow={false}>
          <EuiIcon type="alert" color="danger" size="xxl" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FormattedMessage
            id="home.errorText"
            defaultMessage="There was an error loading the homepage."
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (isHomepageLoading || isWelcomeLoading) {
    return (
      <EuiFlexGroup
        className="home-homepage-body--fill"
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner
            aria-label={i18n.translate('home.loadingSpinner', {
              defaultMessage: 'Loading homepage',
            })}
            size="xl"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FormattedMessage id="home.loadingText" defaultMessage="Loading..." />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (showWelcome) {
    return (
      <Welcome
        urlBasePath={getBasePath()}
        onSkip={onSkip}
        telemetry={telemetry}
        branding={getBranding()}
        logos={logos}
      />
    );
  }

  const hero = heroes?.[0];

  return (
    <>
      {hero && <HeroSection render={hero.render} />}
      {sections?.map(({ render, title }, i) => (
        <>
          <Section key={i} title={title} render={render} />
          <EuiHorizontalRule />
        </>
      ))}
      <Footer />
    </>
  );
};

export const Homepage = () => {
  const {
    application: { getUrlForApp },
    chrome,
    injectedMetadata: { getBranding },
  } = getServices();

  const branding = getBranding();
  // TODO: is there a better way to check if the title is custom?
  const title =
    branding.applicationTitle !== 'OpenSearch Dashboards'
      ? i18n.translate('home.customBrandingTitle', {
          defaultMessage: '{title} - Home',
          values: { title: branding.applicationTitle },
        })
      : i18n.translate('home.title', { defaultMessage: 'Home' });
  const mark = (branding.darkMode && branding.mark?.darkModeUrl) || branding.mark?.defaultUrl;

  useMount(() => {
    chrome.setBreadcrumbs([
      {
        text: i18n.translate('home.breadcrumbs.homeTitle', { defaultMessage: 'Home' }),
      },
    ]);
  });

  const sideItems: React.ReactNode[] = [
    <EuiButtonEmpty
      iconType="wrench"
      href={getUrlForApp('dev_tools', { path: '#/console' })}
      data-test-subj="homeSynopsisLinkconsole"
    >
      <FormattedMessage id="home.devTools" defaultMessage="Dev tools" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty iconType="gear" href={getUrlForApp('management')}>
      <FormattedMessage id="home.manage" defaultMessage="Manage" />
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      iconType="indexOpen"
      href={getUrlForApp('home', { path: '#/tutorial_directory' })}
    >
      <FormattedMessage id="home.addData" defaultMessage="Add data" />
    </EuiButtonEmpty>,
  ];

  return (
    <EuiPageTemplate
      restrictWidth={1680}
      pageHeader={{
        pageTitle: <span data-test-subj="dashboardCustomTitle">{title}</span>,
        rightSideItems: sideItems,
        alignItems: 'center',
        iconType: mark,
        iconProps: {
          'data-test-subj': mark && 'dashboardCustomLogo',
        },
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
      <Content />
    </EuiPageTemplate>
  );
};
