/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageReference } from './language_reference';
import { IntlProvider } from 'react-intl';

// Helper to wrap component with IntlProvider
const renderWithIntl = (ui) => {
  return render(<IntlProvider locale="en">{ui}</IntlProvider>);
};

describe('LanguageReference Component', () => {
  beforeEach(() => {
    // Clear localStorage and DOM before each test
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  test('auto-opens the info box on first load if autoShow is true and sets localStorage key', async () => {
    await act(async () => {
      renderWithIntl(
        <LanguageReference
          body={<div data-test-subj="test-body">Test Body</div>}
          autoShow={true}
          selectedLanguage="SQL"
        />
      );
    });

    // Check localStorage was set
    const storageKey = 'hasSeenInfoBox_SQL';
    expect(localStorage.getItem(storageKey)).toBe('true');

    // Wait for and check if popover content is visible
    await waitFor(() => {
      const popoverContent = screen.getByTestId('test-body');
      expect(popoverContent).toBeInTheDocument();
    });
  });

  test('toggles the info box open and close on button click', async () => {
    await act(async () => {
      renderWithIntl(
        <LanguageReference
          body={<div data-test-subj="test-body">Test Body</div>}
          autoShow={false}
          selectedLanguage="PPL"
        />
      );
    });

    // Wait for button to be available
    await waitFor(() => {
      const button = screen.getByTestId('languageReferenceButton');
      expect(button).toBeInTheDocument();
    });

    // Initially closed
    expect(screen.queryByTestId('test-body')).not.toBeInTheDocument();

    // Click to open
    const button = screen.getByTestId('languageReferenceButton');
    await act(async () => {
      fireEvent.click(button);
    });

    // Wait for content to be visible
    await waitFor(() => {
      const content = screen.getByTestId('test-body');
      expect(content).toBeInTheDocument();
    });

    // Click to close
    await act(async () => {
      fireEvent.click(button);
    });

    // Wait for content to be removed
    await waitFor(() => {
      expect(screen.queryByTestId('test-body')).not.toBeInTheDocument();
    });
  });

  test('shows correct title in popover', async () => {
    await act(async () => {
      renderWithIntl(
        <LanguageReference
          body={<div data-test-subj="test-body">Test Body</div>}
          autoShow={true}
          selectedLanguage="SQL"
        />
      );
    });

    // Wait for and check if the title is rendered
    await waitFor(() => {
      expect(screen.getByText('Syntax options')).toBeInTheDocument();
    });
  });

  test('respects autoShow prop when false', async () => {
    await act(async () => {
      renderWithIntl(
        <LanguageReference
          body={<div data-test-subj="test-body">Test Body</div>}
          autoShow={false}
          selectedLanguage="SQL"
        />
      );
    });

    // Wait for component to be fully rendered
    await waitFor(() => {
      const button = screen.getByTestId('languageReferenceButton');
      expect(button).toBeInTheDocument();
    });

    // Content should not be visible
    expect(screen.queryByTestId('test-body')).not.toBeInTheDocument();
  });
});
