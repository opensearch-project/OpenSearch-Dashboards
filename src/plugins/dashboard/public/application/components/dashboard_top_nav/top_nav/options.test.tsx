/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { OptionsMenu } from './options';

describe('OptionsMenu', () => {
  it('updates the shared crosshair setting', () => {
    const onUseSharedCrosshairChange = jest.fn();

    render(
      <OptionsMenu
        useMargins={true}
        onUseMarginsChange={jest.fn()}
        hidePanelTitles={false}
        onHidePanelTitlesChange={jest.fn()}
        useSharedCrosshair={false}
        onUseSharedCrosshairChange={onUseSharedCrosshairChange}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[2]);

    expect(onUseSharedCrosshairChange).toHaveBeenCalledWith(true);
  });
});
