/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { PanelSettingsAccordion } from './panel_settings_accordion';

describe('PanelSettingsAccordion', () => {
  it('renders the current title and description', () => {
    render(
      <PanelSettingsAccordion
        title="Panel title"
        description="Panel description"
        onChange={() => {}}
      />
    );

    expect(screen.getByTestId('panelSettingsTitle')).toHaveValue('Panel title');
    expect(screen.getByTestId('panelSettingsDescription')).toHaveValue('Panel description');
  });

  it('reports title and description changes independently', () => {
    const onChange = jest.fn();
    render(<PanelSettingsAccordion onChange={onChange} />);

    fireEvent.change(screen.getByTestId('panelSettingsTitle'), {
      target: { value: 'Updated title' },
    });
    fireEvent.change(screen.getByTestId('panelSettingsDescription'), {
      target: { value: 'Updated description' },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, { title: 'Updated title' });
    expect(onChange).toHaveBeenNthCalledWith(2, { description: 'Updated description' });
  });
});
