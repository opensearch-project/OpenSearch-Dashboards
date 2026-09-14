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

describe('LearnMoreLink', () => {
  const setup = ({
    language = 'PPL',
    title,
    docLink,
    version = 'latest',
    isPromptMode = false,
  }: {
    language?: string;
    title?: string;
    docLink?: { title: string; url: string };
    version?: string;
    isPromptMode?: boolean;
  } = {}) => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectIsPromptEditorMode) return isPromptMode;
      if (selector === selectQueryLanguage) return language;
      throw new Error('unexpected selector');
    });

    mockGetServices.mockReturnValue({
      docLinks: { DOC_LINK_VERSION: version },
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

  // The version column is the point of the table. A release build must not send people to
  // docs for whatever the current release is, since those can describe syntax the running
  // cluster does not support.
  it.each([
    ['PPL', 'latest', 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/index/'],
    ['SQL', 'latest', 'https://docs.opensearch.org/latest/sql-and-ppl/sql/index/'],
    ['PPL', '2.19', 'https://docs.opensearch.org/2.19/sql-and-ppl/ppl/index/'],
    ['SQL', '2.19', 'https://docs.opensearch.org/2.19/sql-and-ppl/sql/index/'],
  ])('points %s at its own docs for version %s', (language, version, href) => {
    setup({ language, version });

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

  it("falls back to the language's registered docLink url for an unlisted language", () => {
    setup({
      language: 'PromQL',
      title: 'PromQL',
      docLink: { title: 'PromQL documentation', url: 'https://example.test/promql' },
    });

    expect(renderLink()).toHaveAttribute('href', 'https://example.test/promql');
  });

  it('still renders a real anchor when the language matches nothing registered', () => {
    // Restored URL state or a saved query can carry an id no language registered. Without a
    // fallback EuiLink renders a disabled button, so it is announced but does nothing.
    setup({ language: 'not-a-language' });

    const link = renderLink();
    expect(link).toHaveAttribute('href', 'https://docs.opensearch.org/latest/sql-and-ppl/');
    expect(link.tagName).toBe('A');
  });

  it('renders nothing in prompt mode, where no language chip is selected', () => {
    setup({ language: 'PPL', title: 'PPL', isPromptMode: true });

    render(<LearnMoreLink />);
    expect(screen.queryByTestId('exploreQueryPanelLearnMore')).not.toBeInTheDocument();
  });

  it.each(['constructor', 'toString', 'valueOf', '__proto__'])(
    'does not resolve the inherited object key %s to a doc url',
    (language) => {
      // `queryLanguage` is unvalidated URL state. A plain object literal would resolve these
      // off the prototype to a function, which `??` does not catch, so the fallback below
      // never fires. It threw `url.match is not a function` when passed raw to `href`, and
      // interpolated it builds a nonsense url instead. This asserts the fallback wins.
      setup({ language });

      expect(renderLink()).toHaveAttribute(
        'href',
        'https://docs.opensearch.org/latest/sql-and-ppl/'
      );
    }
  );
});
