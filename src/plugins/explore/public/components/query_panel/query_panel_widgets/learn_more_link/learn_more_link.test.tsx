/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { LearnMoreLink } from './learn_more_link';
import { useSelector } from 'react-redux';
import { getServices } from '../../../../services/services';
import {
  selectIsPromptEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { ExploreServices } from '../../../../types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../services/services', () => ({
  getServices: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockGetServices = getServices as jest.MockedFunction<typeof getServices>;

// Stand-ins for whatever core resolves, since versioning those urls is core's job and is
// covered by its own tests. These only have to be distinguishable from each other.
const DOC_LINKS = {
  ppl: { base: 'https://docs.test/sql-and-ppl/ppl/index/' },
  sql: { base: 'https://docs.test/sql-and-ppl/sql/index/' },
};

describe('LearnMoreLink', () => {
  const setup = ({
    language = 'PPL',
    title,
    docLink,
    isPromptMode = false,
  }: {
    language?: string;
    title?: string;
    docLink?: { title: string; url: string };
    isPromptMode?: boolean;
  } = {}) => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectIsPromptEditorMode) return isPromptMode;
      if (selector === selectQueryLanguage) return language;
      throw new Error('unexpected selector');
    });

    mockGetServices.mockReturnValue({
      docLinks: { links: { noDocumentation: DOC_LINKS } },
      data: {
        query: {
          queryString: {
            getLanguageService: () => ({
              getLanguage: () => (title || docLink ? { title, docLink } : undefined),
            }),
          },
        },
      },
    } as unknown as ExploreServices);
  };

  const renderLink = () => {
    render(<LearnMoreLink />);
    return screen.getByTestId('exploreQueryPanelLearnMore');
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['PPL', DOC_LINKS.ppl.base],
    ['SQL', DOC_LINKS.sql.base],
  ])('points %s at whatever core resolves for it', (language, href) => {
    setup({ language });

    expect(renderLink()).toHaveAttribute('href', href);
  });

  it.each([
    ['PPL', DOC_LINKS.ppl.base],
    ['SQL', DOC_LINKS.sql.base],
  ])('prefers core over the registered docLink for %s', (language, href) => {
    // Pins the precedence rather than leaving it implicit. Core is chosen for these two
    // because it interpolates the running version where the registration hardcodes `latest`,
    // so reordering this chain would silently move every PPL and SQL user.
    setup({
      language,
      docLink: { title: `${language} documentation`, url: 'https://ignored.test' },
    });

    expect(renderLink()).toHaveAttribute('href', href);
  });

  it('opens in a new tab', () => {
    setup();

    expect(renderLink()).toHaveAttribute('target', '_blank');
  });

  it("prefers the language's registered title over its id in the label", () => {
    // The chips above the link label themselves from `title`, so the two must agree.
    setup({ language: 'PPL', title: 'Piped Processing Language' });

    expect(renderLink()).toHaveTextContent('Learn more about Piped Processing Language');
  });

  it("falls back to the language's registered docLink url for any other language", () => {
    // This is how PromQL reaches the Prometheus docs. Core only carries SQL and PPL.
    setup({
      language: 'PROMQL',
      title: 'PromQL',
      docLink: { title: 'PromQL documentation', url: 'https://example.test/promql' },
    });

    expect(renderLink()).toHaveAttribute('href', 'https://example.test/promql');
  });

  it('still renders a real anchor when the language matches nothing registered', () => {
    // Restored URL state or a saved query can carry an id no language registered. Without a
    // fallback EuiLink renders a disabled button. PPL is the default language, so it is the
    // sensible landing place for an id nothing recognises.
    setup({ language: 'not-a-language' });

    const link = renderLink();
    expect(link).toHaveAttribute('href', DOC_LINKS.ppl.base);
    expect(link.tagName).toBe('A');
  });

  it('renders nothing in prompt mode, where no language chip is selected', () => {
    setup({ language: 'PPL', title: 'PPL', isPromptMode: true });

    render(<LearnMoreLink />);
    expect(screen.queryByTestId('exploreQueryPanelLearnMore')).not.toBeInTheDocument();
  });
});
