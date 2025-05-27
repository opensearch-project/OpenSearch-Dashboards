import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { SaveQueryButton } from './save_query';

describe('SaveQueryButton', () => {
  it('renders Saved Queries button', () => {
    render(<SaveQueryButton />);
    expect(screen.getByText('Saved Queries')).toBeInTheDocument();
  });

  it('opens popover and modal', () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByText('Saved Queries'));
    fireEvent.click(screen.getByText('Save current query'));
    expect(screen.getByText('Save query')).toBeInTheDocument();
  });
});
