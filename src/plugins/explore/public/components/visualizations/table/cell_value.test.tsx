/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CellValue } from './cell_value';
import { DataLink } from './data_link_options';

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiPopover: ({
    children,
    button,
    isOpen,
    closePopover,
    panelPaddingSize,
    anchorPosition,
  }: {
    children: React.ReactNode;
    button: React.ReactNode;
    isOpen: boolean;
    closePopover: () => void;
    panelPaddingSize?: string;
    anchorPosition?: string;
  }) => (
    <div data-testid="euiPopover">
      {button}
      {isOpen && (
        <div
          data-testid="popoverPanel"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closePopover();
            }
          }}
          tabIndex={0} // Ensure the div is focusable for keyboard interaction
        >
          {children}
        </div>
      )}
      <button
        data-testid="outsideClickArea"
        data-test-subj="outsideClickArea"
        onClick={() => {
          if (isOpen) closePopover();
        }}
      >
        Outside Click
      </button>
    </div>
  ),
  EuiContextMenuItem: ({
    children,
    href,
    target,
    rel,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    target?: string;
    rel?: string;
    onClick?: () => void;
  }) => (
    <a data-testid="contextMenuItem" href={href} target={target} rel={rel} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe('CellValue', () => {
  const baseProps = {
    setCellProps: jest.fn(),
    textAlign: 'left' as const,
    value: 'TestValue',
    columnId: 'col1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plain text when no dataLinks', () => {
    render(<CellValue {...baseProps} />);
    expect(screen.getByText('TestValue')).toBeInTheDocument();
  });

  it('renders boolean true as text', () => {
    render(<CellValue {...baseProps} value={true} />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('renders boolean false as text', () => {
    render(<CellValue {...baseProps} value={false} />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('renders numeric zero as text', () => {
    render(<CellValue {...baseProps} value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders null as empty string', () => {
    const { container } = render(<CellValue {...baseProps} value={null} />);
    expect(container.querySelector('span')?.textContent).toBe('');
  });

  it('renders undefined as empty string', () => {
    const { container } = render(<CellValue {...baseProps} value={undefined} />);
    expect(container.querySelector('span')?.textContent).toBe('');
  });

  it('renders a single link correctly', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Google',
        url: 'https://google.com?q=${__value.text}',
        openInNewTab: true,
        fields: ['col1'],
      },
    ];
    render(<CellValue {...baseProps} dataLinks={links} />);
    const link = screen.getByRole('link', { name: 'TestValue' });
    expect(link).toHaveAttribute('href', 'https://google.com?q=TestValue');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders boolean value as text inside a single link', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Link',
        url: 'https://example.com?q=${__value.text}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];
    render(<CellValue {...baseProps} value={true} dataLinks={links} />);
    const link = screen.getByRole('link', { name: 'true' });
    expect(link).toHaveAttribute('href', 'https://example.com?q=true');
  });

  it('renders multiple links with popover', async () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Google',
        url: 'https://google.com?q=${__value.text}',
        openInNewTab: false,
        fields: ['col1'],
      },
      {
        id: '2',
        title: 'Bing',
        url: 'https://bing.com?q=${__value.text}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];

    const setPopoverOpen = jest.fn();

    render(
      <CellValue
        {...baseProps}
        dataLinks={links}
        isPopoverOpen={true}
        setPopoverOpen={setPopoverOpen}
      />
    );

    // Popover trigger visible
    const trigger = screen.getByText('TestValue');
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(setPopoverOpen).toHaveBeenCalledWith(true);
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Bing')).toBeInTheDocument();
    });
  });

  it('applies colored text style when colorMode is colored_text', () => {
    const setCellProps = jest.fn();
    render(
      <CellValue {...baseProps} setCellProps={setCellProps} colorMode="colored_text" color="red" />
    );
    expect(setCellProps).toHaveBeenCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({ color: 'red' }),
      })
    );
  });

  it('applies background color when colorMode is colored_background', () => {
    const setCellProps = jest.fn();

    render(
      <CellValue
        {...baseProps}
        setCellProps={setCellProps}
        colorMode="colored_background"
        color="#0000ff"
      />
    );

    expect(setCellProps).toHaveBeenCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({
          backgroundColor: expect.stringMatching(/rgb\(0,\s*0,\s*255\)|#0000ff/i),
        }),
      })
    );
  });

  it('closes popover when closePopover is called', async () => {
    const setPopoverOpen = jest.fn();
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Google',
        url: 'https://google.com?q=${__value.text}',
        openInNewTab: false,
        fields: ['col1'],
      },
      {
        id: '2',
        title: 'Bing',
        url: 'https://bing.com?q=${__value.text}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];

    render(
      <CellValue
        {...baseProps}
        dataLinks={links}
        isPopoverOpen={true}
        setPopoverOpen={setPopoverOpen}
      />
    );

    const trigger = screen.getByText('TestValue');
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(setPopoverOpen).toHaveBeenCalledWith(true);
    });

    const outsideClick = await screen.findByTestId('outsideClickArea');
    fireEvent.click(outsideClick);

    await waitFor(() => {
      expect(setPopoverOpen).toHaveBeenCalledWith(false);
    });
  });
});
