/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Homepage as HomepageType } from '../../../services/section_type/section_type';
import { getServices } from '../../opensearch_dashboards_services';
import { HeroSection } from './hero_section';
import { Section } from './section';

export const Homepage = () => {
  const { sectionTypes } = getServices();

  // TODO: ideally, this should be some sort of observable so changes can be made without having to explicitly hit a save button
  const [homepage, setHomepage] = useState<HomepageType>();
  const [error, setError] = useState();
  const isLoading = !homepage && !error;

  useEffect(() => {
    sectionTypes.getHomepage().then(setHomepage).catch(setError);
  }, [sectionTypes]);

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (error) {
    // TODO: what is the correct way to handle errors here?
    // eslint-disable-next-line no-console
    console.error(error);

    return <span>Error loading homepage</span>;
  }

  function renderSections() {
    return homepage!.sections.map(({ render, title, description, links }, i) => (
      <Section key={i} title={title} description={description} links={links} render={render} />
    ));
  }

  const hero = homepage!.heroes[0];

  return (
    <div>
      {hero && <HeroSection render={hero.render} />}
      {renderSections()}
    </div>
  );
};
