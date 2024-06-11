/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogos } from './get_logos';
import { flatObjectSerializer } from '@osd/dev-utils';

const serverBasePathMocked = '/mocked/base/path';

expect.addSnapshotSerializer(flatObjectSerializer);

describe('getLogos', () => {
  describe('when unbranded', () => {
    const branding = {};

    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });

  describe('when branding has only light logos', () => {
    const branding = {
      logo: { defaultUrl: '/custom/branded/logo.svg' },
      mark: { defaultUrl: '/custom/branded/mark.svg' },
    };
    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });

  describe('when branding has only light logos and spinner', () => {
    const branding = {
      logo: { defaultUrl: '/custom/branded/logo.svg' },
      mark: { defaultUrl: '/custom/branded/mark.svg' },
      loadingLogo: { defaultUrl: '/custom/branded/spinner.svg' },
    };
    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });

  describe('when branding has both light and dark logos', () => {
    const branding = {
      logo: {
        defaultUrl: '/custom/branded/logo.svg',
        darkModeUrl: '/custom/branded/logo-darkmode.svg',
      },
      mark: {
        defaultUrl: '/custom/branded/mark.svg',
        darkModeUrl: '/custom/branded/mark-darkmode.svg',
      },
    };
    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });

  describe('when branding has both light and dark logos and spinners', () => {
    const branding = {
      logo: {
        defaultUrl: '/custom/branded/logo.svg',
        darkModeUrl: '/custom/branded/logo-darkmode.svg',
      },
      mark: {
        defaultUrl: '/custom/branded/mark.svg',
        darkModeUrl: '/custom/branded/mark-darkmode.svg',
      },
      loadingLogo: {
        defaultUrl: '/custom/branded/spinner.svg',
        darkModeUrl: '/custom/branded/spinner-darkmode.svg',
      },
    };
    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });

  describe('when branding has both light and dark logos and only light spinners', () => {
    const branding = {
      logo: {
        defaultUrl: '/custom/branded/logo.svg',
        darkModeUrl: '/custom/branded/logo-darkmode.svg',
      },
      mark: {
        defaultUrl: '/custom/branded/mark.svg',
        darkModeUrl: '/custom/branded/mark-darkmode.svg',
      },
      loadingLogo: {
        defaultUrl: '/custom/branded/spinner.svg',
      },
    };
    it('returns the correct logos', () => {
      expect(getLogos(branding, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when light color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: false }, serverBasePathMocked)).toMatchSnapshot();
    });
    it('returns the correct logos when dark color scheme is requested', () => {
      expect(getLogos({ ...branding, darkMode: true }, serverBasePathMocked)).toMatchSnapshot();
    });
  });
});
