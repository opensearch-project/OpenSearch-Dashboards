# Field Statistics Feature Design Document

## Background

The Field Statistics feature is a new addition to OpenSearchDashboards' Explore plugin that provides users with comprehensive statistical information about fields in their indices. This feature addresses the need for users to quickly understand the composition and distribution of their data without writing complex queries.

The feature will be implemented as a new tab in the Explore interface, similar to the existing Logs, Patterns, and Visualization tabs. It will display a table showing field names, document counts, distinct value counts, and additional type-specific statistics in an expandable row format.

## Requirements

Based on the requirements document, the feature must:

1. **Field Statistics Tab**: Add a new tab labeled "Field Stats" available in Logs and Metrics flavors
2. **Field Statistics Table**: Display all fields with their statistics in a sortable table
3. **Field Statistics Extended Row**: Provide expandable rows with type-specific detailed statistics
4. **Loading State**: Show a "searching in progress" indicator while data is being fetched

## Overview

### Component Structure

```
src/plugins/explore/public/components/
├── tabs/
│   └── field_stats_tab.tsx              # Main tab component
└── field_stats/
    ├── field_stats_container.tsx        # Data fetching and state management
    ├── field_stats_table.tsx            # Table component with column definitions
    ├── field_stats_row_details.tsx      # Expandable row details
    ├── field_stats_queries.ts           # PPL query generation functions
    ├── field_stats_types.ts             # TypeScript interfaces and types
    └── detail_sections/
        ├── top_values_section.tsx       # Top values detail component
        ├── numeric_summary_section.tsx  # Numeric statistics component
        └── date_range_section.tsx       # Date range detail component
```

### Tab Registration

The Field Stats tab will be registered in `register_tabs.ts`:

```typescript
tabRegistry.registerTab({
  id: EXPLORE_FIELD_STATS_TAB_ID,
  label: 'Field Stats',
  flavor: [ExploreFlavor.Logs, ExploreFlavor.Metrics],
  order: 25, // After Visualization tab
  supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
  component: FieldStatsTab,
});
```

## PPL Query Design

### Field Statistics Query Strategy

When the tab is opened, we don't need a query to find all of the fields. Instead, we'll use the existing Redux selector `selectDataset` to get the current index pattern and then use `getIndexPatternFieldList` to get all fields. The fields will be displayed in the table sorted alphanumerically.

#### Getting Fields Without Query

```typescript
import { useSelector } from 'react-redux';
import { selectDataset } from '../../application/utils/state_management/selectors';
import { getIndexPatternFieldList } from '../fields_selector/lib/get_index_pattern_field_list';

// In the component:
const dataset = useSelector(selectDataset);
const fields = useMemo(() => {
  return getIndexPatternFieldList(dataset, {});
}, [dataset]);
```

#### Basic Field Statistics Query

For each field, we'll fetch the following information to display at the top level:

```ppl
source = <index>
| stats count(`<field>`) as count,
        dc(`<field>`) as dc,
        count() as total_count
| eval percentage_total = (count * 100.0) / total_count
```

#### Expanded Row Statistics

When a row is expanded, we display additional information based on field type:

**String Fields (Top Values):**

```ppl
source = <index>
| top 10 <field>
```

**Number Fields (Top Values + Summary):**

```ppl
# For top values:
source = <index>
| top 10 <field>

# For summary statistics:
source = <index>
| stats min(<field>) as min,
        percentile(<field>, 50) as median,
        avg(<field>) as avg,
        max(<field>) as max
```

**IP Fields (Top Values):**

```ppl
source = <index>
| top 10 <field>
```

**Date/Timestamp Fields (Summary):**

```ppl
source = <index>
| stats min(<field>) as earliest,
        max(<field>) as latest
```

**Boolean Fields (Top Values):**

```ppl
source = <index>
| top 2 <field>
```

**Other Field Types (Examples):**

```ppl
source = <index>
| head 10
| fields <field>
| where isnotnull(<field>)
```

### Query Implementation

Since we don't need a `prepareQuery` function for the initial load, we'll implement individual query functions:

```typescript
// Get basic field statistics
export const getFieldStatsQuery = (index: string, fieldName: string): string => {
  return `source = ${index} 
    | stats count(\`${fieldName}\`) as count, 
            dc(\`${fieldName}\`) as dc,
            count() as total_count
    | eval percentage_total = (count * 100.0) / total_count`;
};

// Get top values for a field
export const getFieldTopValuesQuery = (
  index: string,
  fieldName: string,
  limit: number = 10
): string => {
  return `source = ${index} | top ${limit} ${fieldName}`;
};

// Get summary statistics for numeric fields
export const getFieldSummaryQuery = (index: string, fieldName: string): string => {
  return `source = ${index} 
    | stats min(${fieldName}) as min,
            percentile(${fieldName}, 50) as median,
            avg(${fieldName}) as avg,
            max(${fieldName}) as max`;
};

// Get date range for timestamp fields
export const getFieldDateRangeQuery = (index: string, fieldName: string): string => {
  return `source = ${index} 
    | stats min(${fieldName}) as earliest,
            max(${fieldName}) as latest`;
};

// Get example values for other field types
export const getFieldExamplesQuery = (index: string, fieldName: string): string => {
  return `source = ${index} 
    | head 10
    | fields ${fieldName}
    | where isnotnull(${fieldName})`;
};
```

## Tab Component Details

### FieldStatsTab Component

The main tab component that renders the action bar and container:

```typescript
export const FieldStatsTab = () => {
  return (
    <div className="explore-field-stats-tab tab-container">
      <ActionBar data-test-subj="fieldStatsTabActionBar" />
      <FieldStatsContainer data-test-subj="fieldStatsTabContainer" />
    </div>
  );
};
```

### FieldStatsContainer Component

Manages data fetching and state, including expanding row behavior:

```typescript
export const FieldStatsContainer = () => {
  const dataset = useSelector(selectDataset);
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStatsItem>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fieldDetails, setFieldDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState<Set<string>>(new Set());

  // Get fields from dataset
  const fields = useMemo(() => {
    if (!dataset) return [];
    return getIndexPatternFieldList(dataset, {});
  }, [dataset]);

  // Fetch field statistics on mount
  useEffect(() => {
    if (!fields.length || !dataset) return;
    fetchAllFieldStats(fields, dataset, setFieldStats, setLoadingFields);
  }, [fields, dataset]);

  // Handle row expansion
  const handleRowExpand = async (fieldName: string) => {
    const field = Object.values(fieldStats).find((f) => f.name === fieldName);
    if (!field) return;

    // Fetch details if not already fetched
    if (!fieldDetails[fieldName] && !detailsLoading.has(fieldName)) {
      await fetchFieldDetails(field, dataset, setFieldDetails, setDetailsLoading);
    }

    // Toggle expansion
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedRows(newExpanded);
  };

  // Convert fieldStats object to array and sort alphabetically
  const sortedFieldStats = useMemo(() => {
    return Object.values(fieldStats).sort((a, b) => a.name.localeCompare(b.name));
  }, [fieldStats]);

  if (!dataset) {
    return <div>No dataset selected</div>;
  }

  return (
    <FieldStatsTable
      items={sortedFieldStats}
      expandedRows={expandedRows}
      fieldDetails={fieldDetails}
      onRowExpand={handleRowExpand}
      loadingFields={loadingFields}
      detailsLoading={detailsLoading}
    />
  );
};
```

### FieldStatsTable Component

Renders the EuiBasicTable with expandable rows:

```typescript
export const FieldStatsTable = ({ items, expandedRows, fieldDetails, onRowExpand, loadingFields, detailsLoading }) => {
  const columns = getFieldStatsColumns(expandedRows, onRowExpand, loadingFields);

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, ReactNode> = {};
    expandedRows.forEach((fieldName) => {
      if (fieldDetails[fieldName]) {
        map[fieldName] = (
          <FieldStatsRowDetails
            field={items.find((item) => item.name === fieldName)}
            details={fieldDetails[fieldName]}
          />
        );
      }
    });
    return map;
  }, [expandedRows, fieldDetails, items]);

  return (
    <EuiBasicTable
      items={items}
      columns={columns}
      itemId="name"
      itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      isExpandable={true}
      sorting={{
        sort: {
          field: 'name',
          direction: 'asc',
        },
      }}
      ...
    />
  );
};
```

### Fetch All Field Stats Function

Handles fetching statistics for all fields:

```typescript
const fetchAllFieldStats = async (
  fields: DataViewField[],
  dataset: DataView,
  setFieldStats: React.Dispatch<React.SetStateAction<Record<string, FieldStatsItem>>>,
  setLoadingFields: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  // Mark all fields as loading
  setLoadingFields(new Set(fields.map((f) => f.name)));

  // Fetch stats for each field in parallel
  const promises = fields.map(async (field) => {
    try {
      const query = getFieldStatsQuery(dataset.title, field.name);
      const result = await executeQuery(query);

      // Process result and update state
      const stats: FieldStatsItem = {
        name: field.name,
        type: field.type,
        docCount: result.hits[0]?.count || 0,
        distinctCount: result.hits[0]?.dc || 0,
        docPercentage: result.hits[0]?.percentage_total || 0,
      };

      setFieldStats((prev) => ({ ...prev, [field.name]: stats }));
    } catch (error) {
      console.error(`Failed to fetch stats for field ${field.name}:`, error);
      // Set default values on error
      setFieldStats((prev) => ({
        ...prev,
        [field.name]: {
          name: field.name,
          type: field.type,
          docCount: 0,
          distinctCount: 0,
          docPercentage: 0,
          error: true,
        },
      }));
    } finally {
      setLoadingFields((prev) => {
        const next = new Set(prev);
        next.delete(field.name);
        return next;
      });
    }
  });

  await Promise.all(promises);
};
```

### Field Detail Sections Configuration

Configuration-driven approach for field details:

```typescript
interface FieldDetailSection {
  id: string;
  label: string;
  // Function to check if this section applies to a field type
  isApplicable: (fieldType: string) => boolean;
  // Function to fetch the data for this section
  fetchData: (field: FieldStatsItem, index: string) => Promise<any>;
  // Component to render this section
  component: React.ComponentType<{ data: any; field: FieldStatsItem }>;
}

// Configuration for all available detail sections
const fieldDetailSections: FieldDetailSection[] = [
  {
    id: 'topValues',
    label: 'Top Values',
    isApplicable: (type) => ['string', 'number', 'ip', 'boolean'].includes(type),
    fetchData: async (field, index) => {
      const query = getFieldTopValuesQuery(index, field.name);
      const result = await executeQuery(query);
      return result.hits || [];
    },
    component: TopValuesSection,
  },
  {
    id: 'numericSummary',
    label: 'Summary Statistics',
    isApplicable: (type) => ['number'].includes(type),
    fetchData: async (field, index) => {
      const query = getFieldSummaryQuery(index, field.name);
      const result = await executeQuery(query);
      return result.hits[0] || {};
    },
    component: NumericSummarySection,
  },
  {
    id: 'dateRange',
    label: 'Date Range',
    isApplicable: (type) => ['date'].includes(type),
    fetchData: async (field, index) => {
      const query = getFieldDateRangeQuery(index, field.name);
      const result = await executeQuery(query);
      return result.hits[0] || {};
    },
    component: DateRangeSection,
  },
];
```

### Fetch Field Details Function

Handles fetching details for a specific field using the configuration:

```typescript
const fetchFieldDetails = async (
  field: FieldStatsItem,
  dataset: DataView,
  setFieldDetails: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setDetailsLoading: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  if (!dataset) return;

  setDetailsLoading((prev) => new Set(prev).add(field.name));

  try {
    // Get applicable sections for this field type
    const applicableSections = fieldDetailSections.filter((section) =>
      section.isApplicable(field.type)
    );

    // Fetch data for all applicable sections in parallel
    const sectionPromises = applicableSections.map(async (section) => ({
      id: section.id,
      data: await section.fetchData(field, dataset.title),
    }));

    const sectionData = await Promise.all(sectionPromises);

    // Convert to object format
    const details = sectionData.reduce(
      (acc, { id, data }) => ({
        ...acc,
        [id]: data,
      }),
      {}
    );

    setFieldDetails((prev) => ({ ...prev, [field.name]: details }));
  } catch (error) {
    console.error(`Failed to fetch details for field ${field.name}:`, error);
    setFieldDetails((prev) => ({ ...prev, [field.name]: { error: true } }));
  } finally {
    setDetailsLoading((prev) => {
      const next = new Set(prev);
      next.delete(field.name);
      return next;
    });
  }
};
```

### Column Definitions

```typescript
export const getFieldStatsColumns = (
  expandedRows: Set<string>,
  onRowExpand: (fieldName: string) => void,
  loadingFields: Set<string>
): Array<EuiBasicTableColumn<FieldStatsItem>> => [
  {
    width: '40px',
    isExpander: true,
    render: (item: FieldStatsItem) => (
      <EuiButtonIcon
        onClick={() => onRowExpand(item.name)}
        aria-label={expandedRows.has(item.name) ? 'Collapse' : 'Expand'}
        iconType={expandedRows.has(item.name) ? 'arrowDown' : 'arrowRight'}
      />
    ),
  },
  {
    field: 'name',
    name: 'Field Name',
    sortable: true,
    width: '30%',
  },
  {
    field: 'type',
    name: 'Type',
    sortable: true,
    width: '15%',
    render: (type: string) => (
      <span>
        <FieldIcon type={type} size="s" /> {type}
      </span>
    ),
  },
  {
    field: 'docCount',
    name: 'Document Count',
    sortable: true,
    width: '20%',
    render: (docCount: number, item: FieldStatsItem) => {
      if (loadingFields.has(item.name)) {
        return <EuiLoadingSpinner size="s" />;
      }
      return (
        <span>
          {docCount.toLocaleString()} ({item.docPercentage.toFixed(1)}%)
        </span>
      );
    },
  },
  {
    field: 'distinctCount',
    name: 'Distinct Values',
    sortable: true,
    width: '20%',
    render: (count: number, item: FieldStatsItem) => {
      if (loadingFields.has(item.name)) {
        return <EuiLoadingSpinner size="s" />;
      }
      return count?.toLocaleString() || '—';
    },
  },
];
```

### Field Stats Row Details Component

Renders the detail sections based on configuration:

```typescript
export const FieldStatsRowDetails = ({ field, details }) => {
  if (details.error) {
    return <EuiCallOut color="danger" title="Failed to load details" />;
  }

  // Get applicable sections for this field
  const applicableSections = fieldDetailSections.filter(
    (section) => section.isApplicable(field.type) && details[section.id]
  );

  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      {applicableSections.map((section) => {
        const SectionComponent = section.component;
        return (
          <EuiFlexItem key={section.id}>
            <EuiPanel paddingSize="s">
              <EuiTitle size="xs">
                <h4>{section.label}</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <SectionComponent data={details[section.id]} field={field} />
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};
```

### Detail Section Components

Individual components for each type of detail section:

```typescript
// Top Values Section Component
export const TopValuesSection: React.FC<{ data: any[]; field: FieldStatsItem }> = ({
  data,
  field,
}) => {
  const columns = [
    { field: 'value', name: 'Value', width: '60%' },
    { field: 'count', name: 'Count', width: '20%' },
    {
      field: 'percentage',
      name: 'Percentage',
      width: '20%',
      render: (val: number) => `${val.toFixed(1)}%`,
    },
  ];

  return <EuiBasicTable items={data} columns={columns} compressed pagination={false} />;
};

// Numeric Summary Section Component
export const NumericSummarySection: React.FC<{ data: any; field: FieldStatsItem }> = ({ data }) => {
  return (
    <EuiDescriptionList
      type="inline"
      listItems={[
        { title: 'Min', description: data.min?.toLocaleString() || '—' },
        { title: 'Median', description: data.median?.toLocaleString() || '—' },
        { title: 'Average', description: data.avg?.toLocaleString() || '—' },
        { title: 'Max', description: data.max?.toLocaleString() || '—' },
      ]}
    />
  );
};

// Date Range Section Component
export const DateRangeSection: React.FC<{ data: any; field: FieldStatsItem }> = ({ data }) => {
  return (
    <EuiDescriptionList
      type="inline"
      listItems={[
        {
          title: 'Earliest',
          description: data.earliest ? moment(data.earliest).format('YYYY-MM-DD HH:mm:ss') : '—',
        },
        {
          title: 'Latest',
          description: data.latest ? moment(data.latest).format('YYYY-MM-DD HH:mm:ss') : '—',
        },
      ]}
    />
  );
};
```

## Performance Considerations

1. **Lazy Loading**: Only fetch detailed statistics when rows are expanded
2. **Pagination**: Implement virtual scrolling for large numbers of fields
3. **Parallel Queries**: Execute field statistics queries in parallel for faster loading
4. **Debouncing**: Debounce rapid expand/collapse actions
5. **Progressive Loading**: Show fields immediately from the dataset, then load statistics progressively
