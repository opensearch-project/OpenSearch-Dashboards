/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent, act } from 'test_utils/testing_lib_helpers';
import {
  DISCOVERED_AUTO_COLLAPSE_THRESHOLD,
  FIELD_LIST_PAGE_SIZE,
  FIELD_LIST_SCROLL_CAP,
  FieldList,
} from './field_list';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { DataViewField } from '../../../../data/public';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';

jest.mock('./discover_field', () => ({
  DiscoverField: ({ field }: { field: DataViewField }) => (
    <div data-test-subj={`mocked-discover-field-${field.name}`}>{field.name}</div>
  ),
}));

function getProps({
  category = 'discovered',
  title = 'Test Fields',
  fields,
  shortDotsEnabled = false,
}: {
  category?: 'query' | 'discovered' | 'selected';
  title?: string;
  fields?: DataViewField[];
  shortDotsEnabled?: boolean;
} = {}) {
  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  const defaultFields = [
    {
      name: 'bytes',
      type: 'number',
      esTypes: ['long'],
      count: 10,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'bytes',
    } as DataViewField,
    {
      name: 'extension',
      type: 'string',
      esTypes: ['keyword'],
      count: 5,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'extension',
    } as DataViewField,
  ];

  const mockFields = fields !== undefined ? fields : defaultFields;

  return {
    category,
    title,
    fields: mockFields,
    columns: ['@timestamp'],
    selectedDataSet: dataSet,
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    onAddFilter: jest.fn(),
    getDetailsByField: jest.fn(() => ({ buckets: [], error: '', exists: 1, total: 1 })),
    shortDotsEnabled,
    fieldCounts: {},
    hits: [],
    onReorderFields: jest.fn(),
    isEnhancementsEnabledOverride: false,
  };
}

describe('FieldList', () => {
  it('renders field list with title', () => {
    const props = getProps({ title: 'Available Fields' });
    render(<FieldList {...props} />);

    expect(screen.getByText('Available Fields')).toBeInTheDocument();
    expect(screen.getByTestId('dscSideBarFieldGroupButton')).toBeInTheDocument();
  });

  it('renders field items when expanded', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-discover-field-extension')).toBeInTheDocument();
  });

  it('toggles expansion when button is clicked', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    const toggleButton = screen.getByTestId('dscSideBarFieldGroupButton');

    // Initially expanded
    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Fields should be hidden
    expect(screen.queryByTestId('mocked-discover-field-bytes')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(toggleButton);

    // Fields should be visible again
    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();
  });

  it('renders nothing when selectedDataSet is null', () => {
    const props = { ...getProps(), selectedDataSet: undefined };
    const { container } = render(<FieldList {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows correct icon based on expansion state', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    const toggleButton = screen.getByTestId('dscSideBarFieldGroupButton');

    // Initially expanded - should show arrowDown
    expect(toggleButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Should now show arrowRight
    expect(toggleButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();
  });

  it('handles empty fields array', () => {
    const props = getProps({ fields: [] });
    render(<FieldList {...props} />);

    expect(screen.getByText('Test Fields')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-discover-field-bytes')).not.toBeInTheDocument();
  });

  describe('incremental rendering', () => {
    let observerCallback: (entries: Array<Partial<IntersectionObserverEntry>>) => void;

    beforeEach(() => {
      window.IntersectionObserver = jest.fn().mockImplementation((cb) => {
        observerCallback = cb;
        return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
      });
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
      jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const makeFields = (n: number): DataViewField[] =>
      Array.from({ length: n }, (_, i) => {
        const name = `field_${String(i).padStart(5, '0')}`;
        return {
          name,
          displayName: name,
          type: 'string',
          esTypes: ['keyword'],
          count: 0,
          scripted: false,
          searchable: true,
          aggregatable: true,
          readFromDocValues: true,
        } as DataViewField;
      });

    const renderedFieldCount = () => screen.queryAllByTestId('fieldList-field').length;

    const scrollToSentinel = () => {
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });
    };

    it('mounts only the first page of a large group', () => {
      const fields = makeFields(2000);
      render(<FieldList {...getProps({ category: 'query', fields })} />);

      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
      expect(screen.getByTestId('fieldList-sentinel')).toBeInTheDocument();
      expect(screen.queryByTestId('fieldList-showMore')).not.toBeInTheDocument();
    });

    it('renders the next page when the sentinel scrolls into view', () => {
      const fields = makeFields(2000);
      render(<FieldList {...getProps({ category: 'query', fields })} />);

      scrollToSentinel();
      expect(renderedFieldCount()).toBe(2 * FIELD_LIST_PAGE_SIZE);
      expect(screen.getByTestId('mocked-discover-field-field_00050')).toBeInTheDocument();
    });

    it('replaces the sentinel with a show-more button at the scroll cap', () => {
      const fields = makeFields(2000);
      render(<FieldList {...getProps({ category: 'query', fields })} />);

      while (screen.queryByTestId('fieldList-sentinel')) {
        scrollToSentinel();
      }
      expect(renderedFieldCount()).toBe(FIELD_LIST_SCROLL_CAP);

      const showMore = screen.getByTestId('fieldList-showMore');
      expect(showMore).toHaveTextContent(
        `Show ${FIELD_LIST_PAGE_SIZE} more (${2000 - FIELD_LIST_SCROLL_CAP} hidden)`
      );
      fireEvent.click(showMore);
      expect(renderedFieldCount()).toBe(FIELD_LIST_SCROLL_CAP + FIELD_LIST_PAGE_SIZE);
    });

    it('renders everything and no sentinel when the group fits in one page', () => {
      const fields = makeFields(FIELD_LIST_PAGE_SIZE - 1);
      render(<FieldList {...getProps({ category: 'query', fields })} />);

      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE - 1);
      expect(screen.queryByTestId('fieldList-sentinel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fieldList-showMore')).not.toBeInTheDocument();
    });

    it('starts the discovered group collapsed above the threshold and shows its size', () => {
      const fields = makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1);
      render(<FieldList {...getProps({ category: 'discovered', fields })} />);

      expect(renderedFieldCount()).toBe(0);
      expect(screen.getByTestId('fieldList-groupCount')).toHaveTextContent(
        String(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1)
      );

      fireEvent.click(screen.getByTestId('dscSideBarFieldGroupButton'));
      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
      expect(screen.queryByTestId('fieldList-groupCount')).not.toBeInTheDocument();
    });

    it('keeps the discovered group expanded at or below the threshold', () => {
      const fields = makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD);
      render(<FieldList {...getProps({ category: 'discovered', fields })} />);

      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
    });

    it('re-evaluates auto-collapse when the dataset changes', () => {
      const props = getProps({ category: 'discovered', fields: makeFields(10) });
      const { rerender } = render(<FieldList {...props} />);
      expect(renderedFieldCount()).toBe(10);

      const otherDataSet = { ...props.selectedDataSet, id: 'other-dataset' } as any;
      rerender(
        <FieldList
          {...props}
          selectedDataSet={otherDataSet}
          fields={makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1)}
        />
      );
      expect(renderedFieldCount()).toBe(0);
      expect(screen.getByTestId('fieldList-groupCount')).toHaveTextContent(
        String(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1)
      );
    });

    it('collapses a wide discovered group once async field loading finishes', () => {
      const props = getProps({ category: 'discovered', fields: [] });
      const loadingDataSet = { ...props.selectedDataSet, fieldsLoading: true } as any;
      const { rerender } = render(<FieldList {...props} selectedDataSet={loadingDataSet} />);

      const loadedDataSet = { ...props.selectedDataSet, fieldsLoading: false } as any;
      rerender(
        <FieldList
          {...props}
          selectedDataSet={loadedDataSet}
          fields={makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1)}
        />
      );
      expect(renderedFieldCount()).toBe(0);
    });

    it('keeps a manual expand within the same dataset when the field list changes', () => {
      const props = getProps({
        category: 'discovered',
        fields: makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1),
      });
      const { rerender } = render(<FieldList {...props} />);
      fireEvent.click(screen.getByTestId('dscSideBarFieldGroupButton'));
      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);

      rerender(
        <FieldList {...props} fields={makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 50)} />
      );
      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
    });

    it('keeps a manual toggle when fields are refetched for the same dataset', () => {
      const props = getProps({
        category: 'discovered',
        fields: makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1),
      });
      const { rerender } = render(<FieldList {...props} />);
      fireEvent.click(screen.getByTestId('dscSideBarFieldGroupButton'));
      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);

      const reloading = { ...props.selectedDataSet, fieldsLoading: true } as any;
      rerender(<FieldList {...props} selectedDataSet={reloading} />);
      const reloaded = { ...props.selectedDataSet, fieldsLoading: false } as any;
      rerender(<FieldList {...props} selectedDataSet={reloaded} />);
      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
    });

    it('does not auto-collapse the query or selected groups', () => {
      const fields = makeFields(DISCOVERED_AUTO_COLLAPSE_THRESHOLD + 1);
      render(<FieldList {...getProps({ category: 'selected', fields })} />);

      expect(renderedFieldCount()).toBe(FIELD_LIST_PAGE_SIZE);
    });

    it('keeps the rendered count when the field list changes for the same dataset', () => {
      const fields = makeFields(2000);
      const props = getProps({ category: 'query', fields });
      const { rerender } = render(<FieldList {...props} />);
      scrollToSentinel();
      expect(renderedFieldCount()).toBe(2 * FIELD_LIST_PAGE_SIZE);

      rerender(<FieldList {...props} fields={makeFields(1500)} />);
      expect(renderedFieldCount()).toBe(2 * FIELD_LIST_PAGE_SIZE);
    });
  });
});
