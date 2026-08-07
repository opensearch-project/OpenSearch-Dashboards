/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { FieldMenu } from './field_menu';

describe('FieldMenu', () => {
  it('shows the placeholder when nothing is selected and the value when it is', () => {
    const { rerender } = render(
      <FieldMenu
        options={['service', 'bytes']}
        value=""
        onChange={jest.fn()}
        placeholder="of field"
        dataTestSubj="pplBuilderAggField-0"
      />
    );
    expect(screen.getByText('of field')).toBeInTheDocument();

    rerender(
      <FieldMenu
        options={['service', 'bytes']}
        value="service"
        onChange={jest.fn()}
        placeholder="of field"
        dataTestSubj="pplBuilderAggField-0"
      />
    );
    expect(screen.getByText('service')).toBeInTheDocument();
  });

  it('renders the option list when the trigger is opened', () => {
    render(
      <FieldMenu
        options={['service', 'bytes']}
        value=""
        onChange={jest.fn()}
        dataTestSubj="pplBuilderSortColumn"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    expect(screen.getByTestId('pplBuilderFieldOption-service')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFieldOption-bytes')).toBeInTheDocument();
  });

  it('calls onChange with the picked field in single mode', () => {
    const onChange = jest.fn();
    render(
      <FieldMenu
        options={['service', 'bytes']}
        value=""
        onChange={onChange}
        dataTestSubj="pplBuilderSortColumn"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    fireEvent.click(screen.getByTestId('pplBuilderFieldOption-bytes'));
    expect(onChange).toHaveBeenCalledWith('bytes');
  });

  it('toggles a field into the selection in multi mode', () => {
    const onChange = jest.fn();
    render(
      <FieldMenu
        multi
        options={['service', 'bytes']}
        value={['service']}
        onChange={onChange}
        renderTrigger={(toggle) => (
          <button type="button" data-test-subj="pplBuilderGroupByFields" onClick={toggle}>
            trigger
          </button>
        )}
        caretAriaLabel="open"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
    fireEvent.click(screen.getByTestId('pplBuilderFieldOption-bytes'));
    expect(onChange).toHaveBeenCalledWith(['service', 'bytes']);
  });

  it('removes an already-selected field in multi mode', () => {
    const onChange = jest.fn();
    render(
      <FieldMenu
        multi
        options={['service', 'bytes']}
        value={['service', 'bytes']}
        onChange={onChange}
        renderTrigger={(toggle) => (
          <button type="button" data-test-subj="pplBuilderGroupByFields" onClick={toggle}>
            trigger
          </button>
        )}
        caretAriaLabel="open"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
    fireEvent.click(screen.getByTestId('pplBuilderFieldOption-service'));
    expect(onChange).toHaveBeenCalledWith(['bytes']);
  });

  it('renders the "over time" entry pinned at the top and fires its onSelect', () => {
    const onSelect = jest.fn();
    render(
      <FieldMenu
        multi
        options={['service']}
        value={[]}
        onChange={jest.fn()}
        overTime={{ hint: 'every 1h', tooltip: 'span(@timestamp, 1h)', onSelect }}
        renderTrigger={(toggle) => (
          <button type="button" data-test-subj="pplBuilderGroupByFields" onClick={toggle}>
            trigger
          </button>
        )}
        caretAriaLabel="open"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
    const overTime = screen.getByTestId('pplBuilderGroupByOverTime');
    expect(overTime).toBeInTheDocument();
    fireEvent.click(overTime);
    expect(onSelect).toHaveBeenCalled();
  });

  it('creates a new field value typed into the search box', () => {
    const onChange = jest.fn();
    render(
      <FieldMenu
        options={['service']}
        value=""
        onChange={onChange}
        dataTestSubj="pplBuilderSortColumn"
      />
    );
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    fireEvent.change(screen.getByTestId('pplBuilderSortColumn-search'), {
      target: { value: 'custom_field' },
    });
    fireEvent.click(screen.getByTestId('pplBuilderFieldOptionCreate'));
    expect(onChange).toHaveBeenCalledWith('custom_field');
  });
});
