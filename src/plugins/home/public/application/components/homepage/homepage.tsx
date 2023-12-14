/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SavedHomepage } from '../../../saved_homepage';
import { getServices } from '../../opensearch_dashboards_services';

export const Homepage = () => {
  const { sectionTypes } = getServices();

  // TODO: ideally, this should be some sort of observable so changes can be made without having to explicitly hit a save button
  const [homepage, setHomepage] = useState<SavedHomepage>();
  const [error, setError] = useState();
  const isLoading = !homepage && !error;

  useEffect(() => {
    sectionTypes.getHomepage().then(setHomepage).catch(setError);
  }, [sectionTypes]);

  // eslint-disable-next-line no-console
  console.log(homepage, isLoading, error);

  return <span>Hello world</span>;
};
