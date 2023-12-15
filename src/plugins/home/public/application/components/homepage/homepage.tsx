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

  // eslint-disable-next-line no-console
  console.log(homepage, isLoading, error);

  if (isLoading) {
    return <span>Loading...</span>;
  }

  function renderSections() {
    return homepage!.sections.map((section, i) => (
      <Section key={i} title={section.title} render={section.render} />
    ));
  }

  const hero = homepage!.heroes[0];

  return (
    <div>
      {hero && <HeroSection render={hero.render} />}
      <h2>sections:</h2>
      {renderSections()}
    </div>
  );
};
