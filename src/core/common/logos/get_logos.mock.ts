/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogos } from './get_logos';
import { Logos } from './types';

export const getLogosMock: {
  default: DeeplyMockedKeys<Logos>;
  branded: DeeplyMockedKeys<Logos>;
} = {
  default: getLogos({}, ''),
  branded: getLogos(
    {
      logo: {
        defaultUrl: '/custom/branded/logo.svg',
        darkModeUrl: '/custom/branded/logo-darkmode.svg',
      },
      mark: {
        defaultUrl: '/custom/branded/mark.svg',
        darkModeUrl: '/custom/branded/mark-darkmode.svg',
      },
    },
    ''
  ),
};
