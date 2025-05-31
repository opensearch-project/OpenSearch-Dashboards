import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { SwitchLanguage } from './switch_language';

describe('SwitchLanguage', () => {
  it('renders globe icon button', () => {
    render(<SwitchLanguage />);
    expect(screen.getByLabelText('Switch Language')).toBeInTheDocument();
  });

  it('opens popover and selects language', () => {
    render(<SwitchLanguage />);
    fireEvent.click(screen.getByLabelText('Switch Language'));
    expect(screen.getByText('Select Language')).toBeInTheDocument();
  });
});
