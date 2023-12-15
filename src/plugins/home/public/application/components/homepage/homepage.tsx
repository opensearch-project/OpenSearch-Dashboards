/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Homepage as HomepageType } from '../../../services/section_type/section_type';
import { getServices } from '../../opensearch_dashboards_services';
import { LazyRender } from './lazy_render';

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

  function renderHero() {
    if (Array.isArray(homepage!.heroes)) {
      return (
        <div>
          {homepage!.heroes.map((hero, i) => (
            <LazyRender key={i} render={hero.render} />
          ))}
        </div>
      );
    }

    return <span>{JSON.stringify(homepage!.heroes)}</span>;
  }

  return (
    <div>
      <h2>heros:</h2>
      {renderHero()}
      <h2>sections:</h2>
      <ul>
        {homepage!.sections.map((section, i) => (
          <li key={i}>{JSON.stringify(section)}</li>
        ))}
      </ul>
    </div>
  );
};
