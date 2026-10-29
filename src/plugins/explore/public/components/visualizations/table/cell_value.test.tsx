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

  it('renders object value as JSON string', () => {
    const objValue = { name: 'John', age: 30 };
    render(<CellValue {...baseProps} value={objValue} />);
    expect(screen.getByText(JSON.stringify(objValue))).toBeInTheDocument();
  });

  it('renders array value as JSON string', () => {
    const arrValue = ['tag1', 'tag2', 'tag3'];
    render(<CellValue {...baseProps} value={arrValue} />);
    expect(screen.getByText(JSON.stringify(arrValue))).toBeInTheDocument();
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

  it('resolves row fields and dashboard variables in a link', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Open',
        url: '/app?s=${__data.fields.service}&e=${__value.text}&env=$env',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];
    render(
      <CellValue
        {...baseProps}
        dataLinks={links}
        row={{ col1: 'TestValue', service: 'checkout' }}
        variables={[{ name: 'env', value: 'prod' }]}
      />
    );
    const link = screen.getByRole('link', { name: 'TestValue' });
    expect(link).toHaveAttribute('href', '/app?s=checkout&e=TestValue&env=prod');
  });

  it('shows plain text, with the reason, when a placeholder cannot be resolved', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Open',
        url: '/app?s=${__data.fields.missing}&env=${unknown}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];
    render(<CellValue {...baseProps} dataLinks={links} row={{ col1: 'TestValue' }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('TestValue')).toHaveAttribute(
      'title',
      'No link: ${__data.fields.missing}, ${unknown} could not be resolved for this row'
    );
  });

  it.each([
    {
      name: 'OData query options',
      url: "https://api.example.com/odata/Orders?$filter=Ext eq '${__value.text}'&$top=10",
      href: "https://api.example.com/odata/Orders?$filter=Ext eq 'TestValue'&$top=10",
    },
    { name: 'a price', url: '/shop?price=$5', href: '/shop?price=$5' },
  ])('keeps a link whose bare $word names no variable: $name', ({ url, href }) => {
    const links: DataLink[] = [
      { id: '1', title: 'Open', url, openInNewTab: false, fields: ['col1'] },
    ];
    render(<CellValue {...baseProps} dataLinks={links} />);
    const link = screen.getByRole('link', { name: 'TestValue' });
    expect(link).toHaveAttribute('href', href);
    expect(link).not.toHaveAttribute('title');
  });

  it('does not render a link with a script scheme', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Bad',
        // eslint-disable-next-line no-script-url
        url: 'javascript:alert(1)',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];
    render(<CellValue {...baseProps} dataLinks={links} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('TestValue')).not.toHaveAttribute('title');
  });

  it('does not render a relative link that the cell value moves to another host', () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Moved',
        url: '/${__value.text:rison}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];
    render(<CellValue {...baseProps} value="/evil.com" dataLinks={links} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('/evil.com')).toBeInTheDocument();
  });

  it('names each unresolved placeholder once, across links', () => {
    const links: DataLink[] = [
      { id: '1', title: 'A', url: '/a/${unknown}', openInNewTab: false, fields: ['col1'] },
      { id: '2', title: 'B', url: '/b/${unknown}', openInNewTab: false, fields: ['col1'] },
      // eslint-disable-next-line no-script-url
      { id: '3', title: 'C', url: 'javascript:alert(1)', openInNewTab: false, fields: ['col1'] },
    ];
    render(<CellValue {...baseProps} dataLinks={links} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('TestValue')).toHaveAttribute(
      'title',
      'No link: ${unknown} could not be resolved for this row'
    );
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

  it('lists only the resolved links in the popover, with their resolved URLs', async () => {
    const links: DataLink[] = [
      {
        id: '1',
        title: 'Service',
        url: '/service?name=${__data.fields.service}&env=$env',
        openInNewTab: false,
        fields: ['col1'],
      },
      {
        id: '2',
        title: 'Endpoint',
        url: '/endpoint?path=${__value.text}&env=${env}',
        openInNewTab: true,
        fields: ['col1'],
      },
      {
        id: '3',
        title: 'Unresolved',
        url: '/b/${__data.fields.missing}',
        openInNewTab: false,
        fields: ['col1'],
      },
    ];

    render(
      <CellValue
        {...baseProps}
        dataLinks={links}
        isPopoverOpen={true}
        setPopoverOpen={jest.fn()}
        row={{ col1: 'TestValue', service: 'checkout' }}
        variables={[{ name: 'env', value: 'prod' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Service' })).toHaveAttribute(
        'href',
        '/service?name=checkout&env=prod'
      );
      expect(screen.getByRole('link', { name: 'Endpoint' })).toHaveAttribute(
        'href',
        '/endpoint?path=TestValue&env=prod'
      );
    });
    expect(screen.queryByRole('link', { name: 'Unresolved' })).not.toBeInTheDocument();
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
