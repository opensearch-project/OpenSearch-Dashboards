/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ModeButtonGroup } from './mode_button_group';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: jest.fn((_key, opts) => opts.defaultMessage) },
}));

describe('ModeButtonGroup', () => {
  it('renders both mode options', () => {
    render(<ModeButtonGroup mode="code" onChange={jest.fn()} />);
    expect(screen.getByTestId('pplBuilderModeToggle')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderModeToggle-code')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderModeToggle-builder')).toBeInTheDocument();
  });

  it('fires onChange with "builder" when the Builder option is clicked', () => {
    const onChange = jest.fn();
    render(<ModeButtonGroup mode="code" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle-builder'));
    expect(onChange).toHaveBeenCalledWith('builder');
  });

  it('fires onChange with "code" when the Code option is clicked', () => {
    const onChange = jest.fn();
    render(<ModeButtonGroup mode="builder" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('pplBuilderModeToggle-code'));
    expect(onChange).toHaveBeenCalledWith('code');
  });

  it('disables the Builder option when builderDisabled is set', () => {
    render(<ModeButtonGroup mode="code" onChange={jest.fn()} builderDisabled />);
    expect(screen.getByTestId('pplBuilderModeToggle-builder')).toBeDisabled();
    expect(screen.getByTestId('pplBuilderModeToggle-code')).not.toBeDisabled();
  });
});
