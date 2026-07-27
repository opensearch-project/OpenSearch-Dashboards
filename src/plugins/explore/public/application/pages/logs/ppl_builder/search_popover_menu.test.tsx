/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';

const simpleTrigger = (toggle: () => void) => ({
  anchor: (
    <button type="button" data-test-subj="menuTrigger" onClick={toggle}>
      open
    </button>
  ),
});

const open = () => fireEvent.click(screen.getByTestId('menuTrigger'));

const renderMenu = (
  options: SearchMenuOption[],
  props: Partial<React.ComponentProps<typeof SearchPopoverMenu>> = {}
) =>
  render(
    <SearchPopoverMenu
      options={options}
      trigger={props.trigger ?? simpleTrigger}
      searchPlaceholder={props.searchPlaceholder ?? 'Search'}
      emptyMessage={props.emptyMessage ?? 'No results'}
      searchDataTestSubj={props.searchDataTestSubj ?? 'menuSearch'}
      {...props}
    />
  );

const makeOptions = (): SearchMenuOption[] => [
  { key: 'count', label: 'Count', onSelect: jest.fn(), dataTestSubj: 'opt-count' },
  { key: 'sum', label: 'Sum', onSelect: jest.fn(), dataTestSubj: 'opt-sum' },
];

describe('SearchPopoverMenu', () => {
  it('opens the popover and lists options only after the trigger is clicked', () => {
    renderMenu(makeOptions());
    expect(screen.queryByTestId('opt-count')).not.toBeInTheDocument();
    open();
    expect(screen.getByTestId('opt-count')).toBeInTheDocument();
    expect(screen.getByTestId('opt-sum')).toBeInTheDocument();
  });

  it('invokes onSelect and closes the popover on a selection', () => {
    const options = makeOptions();
    renderMenu(options);
    open();
    // EUI keeps the portaled panel mounted in the test env, so close is asserted
    // via the search box clearing rather than the panel unmounting.
    const searchBox = screen.getByTestId('menuSearch') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'count' } });
    fireEvent.click(screen.getByTestId('opt-count'));
    expect(options[0].onSelect).toHaveBeenCalledTimes(1);
    expect(searchBox.value).toBe('');
  });

  it('keeps the popover open but clears the search on select when keepOpenOnSelect is set', () => {
    const options = makeOptions();
    renderMenu(options, { keepOpenOnSelect: true });
    open();
    const searchBox = screen.getByTestId('menuSearch') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'count' } });
    fireEvent.click(screen.getByTestId('opt-count'));
    expect(options[0].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('opt-count')).toBeInTheDocument();
    expect(searchBox.value).toBe('');
  });

  it('clears the search after a create when keepOpenOnSelect is set (multi-value)', () => {
    const onCreate = jest.fn();
    renderMenu(makeOptions(), {
      keepOpenOnSelect: true,
      allowCreate: { onCreate, dataTestSubj: 'createRow' },
    });
    open();
    const searchBox = screen.getByTestId('menuSearch') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'aaa' } });
    fireEvent.click(screen.getByTestId('createRow'));
    expect(onCreate).toHaveBeenCalledWith('aaa');
    expect(searchBox.value).toBe('');
  });

  it('filters the list by the search query (matching filterText/key)', () => {
    renderMenu(makeOptions());
    open();
    fireEvent.change(screen.getByTestId('menuSearch'), { target: { value: 'sum' } });
    expect(screen.getByTestId('opt-sum')).toBeInTheDocument();
    expect(screen.queryByTestId('opt-count')).not.toBeInTheDocument();
  });

  it('shows the empty message when nothing matches and create is not allowed', () => {
    renderMenu(makeOptions());
    open();
    fireEvent.change(screen.getByTestId('menuSearch'), { target: { value: 'zzz' } });
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('applies the first surviving match on Enter', () => {
    const options = makeOptions();
    renderMenu(options);
    open();
    const searchBox = screen.getByTestId('menuSearch');
    fireEvent.change(searchBox, { target: { value: 'su' } });
    fireEvent.keyDown(searchBox, { key: 'Enter' });
    expect(options[1].onSelect).toHaveBeenCalledTimes(1);
    expect(options[0].onSelect).not.toHaveBeenCalled();
  });

  it('closes the popover on Escape (clearing the search query)', () => {
    renderMenu(makeOptions());
    open();
    const searchBox = screen.getByTestId('menuSearch') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'count' } });
    fireEvent.keyDown(searchBox, { key: 'Escape' });
    expect(searchBox.value).toBe('');
  });

  it('offers a create row for a non-matching query and calls onCreate', () => {
    const onCreate = jest.fn();
    renderMenu(makeOptions(), {
      allowCreate: { onCreate, dataTestSubj: 'createRow' },
    });
    open();
    fireEvent.change(screen.getByTestId('menuSearch'), { target: { value: 'p90' } });
    const createRow = screen.getByTestId('createRow');
    expect(createRow).toHaveTextContent('p90');
    fireEvent.click(createRow);
    expect(onCreate).toHaveBeenCalledWith('p90');
  });

  it('applies create on Enter when the query matches no option', () => {
    const onCreate = jest.fn();
    renderMenu(makeOptions(), { allowCreate: { onCreate } });
    open();
    const searchBox = screen.getByTestId('menuSearch');
    fireEvent.change(searchBox, { target: { value: 'custom-field' } });
    fireEvent.keyDown(searchBox, { key: 'Enter' });
    expect(onCreate).toHaveBeenCalledWith('custom-field');
  });

  it('renders group headers derived from the option order + group field', () => {
    const options: SearchMenuOption[] = [
      { key: 'a', label: 'A', group: 'Group 1', onSelect: jest.fn(), dataTestSubj: 'opt-a' },
      { key: 'b', label: 'B', group: 'Group 1', onSelect: jest.fn(), dataTestSubj: 'opt-b' },
      { key: 'c', label: 'C', group: 'Group 2', onSelect: jest.fn(), dataTestSubj: 'opt-c' },
    ];
    renderMenu(options);
    open();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
  });

  it('marks selected rows with a visible check in a checkable menu', () => {
    const options: SearchMenuOption[] = [
      { key: 'a', label: 'A', selected: true, onSelect: jest.fn(), dataTestSubj: 'opt-a' },
      { key: 'b', label: 'B', selected: false, onSelect: jest.fn(), dataTestSubj: 'opt-b' },
    ];
    renderMenu(options, { checkable: true });
    open();
    // Unselected rows carry the --hidden modifier on their check; selected ones do not.
    const allChecks = document.querySelectorAll('.plqFieldOption__check');
    const hiddenChecks = document.querySelectorAll('.plqFieldOption__check--hidden');
    expect(allChecks).toHaveLength(2);
    expect(hiddenChecks).toHaveLength(1);
  });

  it('renders leading text and a wrapper when the trigger returns them', () => {
    const trigger = (toggle: () => void) => ({
      anchor: (
        <button type="button" data-test-subj="menuTrigger" onClick={toggle}>
          caret
        </button>
      ),
      leading: <span data-test-subj="menuLeading">label</span>,
      wrapperClassName: 'plqWrap',
    });
    const { container } = renderMenu(makeOptions(), { trigger });
    expect(screen.getByTestId('menuLeading')).toBeInTheDocument();
    expect(container.querySelector('.plqWrap')).toBeInTheDocument();
  });
});
