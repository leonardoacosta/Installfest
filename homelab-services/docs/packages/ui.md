# @homelab/ui

Shared React components with Tailwind CSS styling for consistent UI across homelab services.

## Overview

The UI package provides reusable, type-safe React components that maintain consistent design patterns across Claude Agent and Playwright Server applications.

**Features**:
- Fully typed with TypeScript
- Tailwind CSS styling
- Accessible (ARIA attributes)
- Responsive design
- Consistent theming

## Installation

Already included as workspace dependency:

```json
{
  "dependencies": {
    "@homelab/ui": "workspace:*"
  }
}
```

## Components

### DataTable

Generic sortable and filterable table component.

#### Props

```typescript
interface DataTableProps<T> {
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  data: T[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

#### Usage

```typescript
import { DataTable } from '@homelab/ui';

interface Report {
  id: number;
  workflow: string;
  status: 'passed' | 'failed';
  createdAt: Date;
}

<DataTable<Report>
  columns={[
    { key: 'workflow', label: 'Workflow', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={value === 'passed' ? 'text-green-500' : 'text-red-500'}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ]}
  data={reports}
  onSort={(key, direction) => handleSort(key, direction)}
  loading={isLoading}
  emptyMessage="No reports found"
/>
```

#### Features

- Sortable columns (click headers)
- Custom cell rendering
- Loading state with skeleton
- Empty state message
- Responsive layout (horizontal scroll on mobile)

---

### StatsCard

Metric display card with optional trend indicator.

#### Props

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}
```

#### Usage

```typescript
import { StatsCard } from '@homelab/ui';
import { CheckCircle } from 'lucide-react';

<StatsCard
  title="Test Success Rate"
  value="94.2%"
  subtitle="Last 30 days"
  trend={{
    value: 5.3,
    direction: 'up',
    label: 'vs last month'
  }}
  icon={<CheckCircle />}
  variant="success"
/>
```

#### Variants

- `default` - Gray border and background
- `success` - Green accent
- `warning` - Yellow accent
- `error` - Red accent

---

### DateRangePicker

Date range selection with preset options.

#### Props

```typescript
interface DateRangePickerProps {
  value: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  presets?: Array<{
    label: string;
    range: { from: Date; to: Date };
  }>;
  disabled?: boolean;
}
```

#### Usage

```typescript
import { DateRangePicker } from '@homelab/ui';
import { useState } from 'react';

const [dateRange, setDateRange] = useState({
  from: undefined,
  to: undefined
});

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presets={[
    {
      label: 'Last 7 days',
      range: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date()
      }
    },
    {
      label: 'Last 30 days',
      range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      }
    }
  ]}
/>
```

#### Features

- Calendar picker for custom ranges
- Preset buttons for common ranges
- Keyboard navigation
- Accessible

---

### SearchInput

Debounced search input with clear button.

#### Props

```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;  // milliseconds
  onClear?: () => void;
  disabled?: boolean;
}
```

#### Usage

```typescript
import { SearchInput } from '@homelab/ui';
import { useState } from 'react';

const [search, setSearch] = useState('');

<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search reports..."
  debounce={300}
  onClear={() => setSearch('')}
/>
```

#### Features

- Debounced input (default 300ms)
- Clear button when value present
- Search icon
- Loading indicator during debounce

---

### Layout

Common page layout with navigation and header.

#### Props

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  navigation?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
}
```

#### Usage

```typescript
import { Layout } from '@homelab/ui';
import Link from 'next/link';

<Layout
  title="Test Reports"
  subtitle="View and manage test reports"
  actions={
    <button className="btn-primary">
      New Report
    </button>
  }
  navigation={[
    { label: 'Reports', href: '/reports', active: true },
    { label: 'Workflows', href: '/workflows' },
    { label: 'Settings', href: '/settings' }
  ]}
>
  {/* Page content */}
</Layout>
```

#### Features

- Responsive header
- Navigation bar
- Breadcrumbs
- Action buttons slot
- Consistent spacing

---

## Hooks

### useDebounce

Debounce value changes.

```typescript
import { useDebounce } from '@homelab/ui';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

// debouncedSearch updates 300ms after last change
useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### useMediaQuery

React to media query changes.

```typescript
import { useMediaQuery } from '@homelab/ui';

const isMobile = useMediaQuery('(max-width: 768px)');

return (
  <div>
    {isMobile ? <MobileView /> : <DesktopView />}
  </div>
);
```

### usePagination

Manage pagination state.

```typescript
import { usePagination } from '@homelab/ui';

const {
  page,
  limit,
  offset,
  goToPage,
  nextPage,
  prevPage,
  setLimit
} = usePagination({
  initialPage: 1,
  initialLimit: 20
});

// Use with tRPC
const { data } = trpc.reports.list.useQuery({
  limit,
  offset
});
```

---

## Utilities

### classNames

Conditionally join CSS class names.

```typescript
import { classNames } from '@homelab/ui';

const buttonClass = classNames(
  'btn',
  variant === 'primary' && 'btn-primary',
  isDisabled && 'opacity-50',
  className  // Allow override
);

<button className={buttonClass}>Click me</button>
```

### formatDate

Format dates consistently.

```typescript
import { formatDate } from '@homelab/ui';

formatDate(new Date(), 'short');  // "12/4/25"
formatDate(new Date(), 'long');   // "December 4, 2025"
formatDate(new Date(), 'time');   // "2:30 PM"
formatDate(new Date(), 'datetime'); // "Dec 4, 2025 2:30 PM"
```

### formatNumber

Format numbers with locale.

```typescript
import { formatNumber } from '@homelab/ui';

formatNumber(1234567);           // "1,234,567"
formatNumber(0.942, 'percent');  // "94.2%"
formatNumber(1024, 'bytes');     // "1 KB"
```

---

## Theming

### Tailwind Configuration

All apps must include UI package in Tailwind config:

```javascript
// apps/*/tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',  // Include UI components!
  ],
  theme: {
    extend: {
      // Custom theme overrides
    },
  },
};
```

### Custom Styling

Override component styles via className prop:

```typescript
<DataTable
  className="custom-table"
  // Component applies: "base-classes custom-table"
/>
```

Or wrap in custom component:

```typescript
export function CustomDataTable(props) {
  return (
    <div className="custom-wrapper">
      <DataTable {...props} />
    </div>
  );
}
```

---

## Development

### Building

```bash
cd packages/ui
bun run build
```

Outputs to `dist/` for consumption by apps.

### Watch Mode

```bash
bun run build --watch
```

Rebuilds automatically on file changes.

### Testing Components

Create test file next to component:

```typescript
// packages/ui/src/DataTable.test.tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  test('renders columns and data', () => {
    render(
      <DataTable
        columns={[{ key: 'name', label: 'Name' }]}
        data={[{ name: 'Test' }]}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

Run tests:

```bash
bun test
```

---

## Best Practices

### Type Safety

Always provide TypeScript generics:

```typescript
// ✅ Good: Fully typed
<DataTable<Report>
  columns={[ /* ... */ ]}
  data={reports}
/>

// ❌ Bad: Loses type safety
<DataTable
  columns={[ /* ... */ ]}
  data={reports as any}
/>
```

### Composition Over Props

Use composition for complex customization:

```typescript
// Instead of many props:
<ComplexComponent
  showHeader
  headerTitle="Title"
  headerActions={<button />}
  showFooter
  footerContent={<div />}
/>

// Prefer composition:
<ComplexComponent>
  <ComplexComponent.Header
    title="Title"
    actions={<button />}
  />
  <ComplexComponent.Body>
    {/* content */}
  </ComplexComponent.Body>
  <ComplexComponent.Footer>
    {/* footer */}
  </ComplexComponent.Footer>
</ComplexComponent>
```

### Accessibility

- Use semantic HTML (`<button>` not `<div onClick>`)
- Include ARIA labels
- Support keyboard navigation
- Ensure color contrast

```typescript
<button
  onClick={handleClick}
  aria-label="Close dialog"
  className="..."
>
  <X aria-hidden="true" />
</button>
```

### Performance

- Use React.memo for expensive components
- Avoid inline function definitions in render
- Use useCallback for callback props

```typescript
import { memo, useCallback } from 'react';

export const DataTable = memo(function DataTable<T>(props: DataTableProps<T>) {
  const handleSort = useCallback((key: keyof T) => {
    props.onSort?.(key, 'asc');
  }, [props.onSort]);

  // ...
});
```

---

## Related Documentation

- [Architecture Guide](../architecture.md) - Overall system design
- [Development Guide](../development.md) - Setup and workflows
- [Contributing Guide](../contributing.md) - Code standards
- [Database Package](./db.md) - Database utilities
- [Validators Package](./validators.md) - Validation schemas
