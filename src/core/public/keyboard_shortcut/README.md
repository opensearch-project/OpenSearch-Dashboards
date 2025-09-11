# Keyboard Shortcuts

Comprehensive guide to keyboard shortcuts and customization in OpenSearch Dashboards

## Keyboard Shortcuts Help Modal

OpenSearch Dashboards includes a built-in keyboard shortcuts help modal that displays all available shortcuts organized by category.

> **Quick Access:** Press `?` or `Shift+/` from anywhere in the application to open the help modal.

The modal shows shortcuts grouped by categories like "Navigation", "Editing", "Data Actions", etc. Each shortcut displays the key combination and description.

## Default Keyboard Shortcuts

### macOS/Windows/Linux

#### Navigation

| Shortcut | Command | Description |
|----------|---------|-------------|
| `G B` | Go to Dashboard | Navigate to Dashboard application |
| `G V` | Go to Visualize | Navigate to Visualize application |
| `G D` | Go to Discover | Navigate to Discover application |
| `?` | Show this help | Opens the help modal with all available shortcuts |
| `⌘ L` | Switch to logs tab | Navigate to logs tab in Explore |
| `⌘ P` | Switch to patterns tab | Navigate to patterns tab in Explore |
| `⌘ V` | Switch to visualization tab | Navigate to visualization tab in Explore |

#### Panel / Layout

| Shortcut | Command | Description |
|----------|---------|-------------|
| `⌘ B` | Toggle Navbar | Shows/hides the main navigation bar |
| `⌘ F` | Toggle fields panel | Shows/hides the fields selector panel |

#### Search

| Shortcut | Command | Description |
|----------|---------|-------------|
| `⌘ O` | Saved search | Opens saved search dialog |
| `⌘ D` | Open date picker | Opens the time range selector |
| `⌘ Q` | Recent queries | Opens recent queries panel |
| `R` | Refresh results | Refreshes the current data view |
| `/` | Focus query bar | Focuses the search query input field |

#### Data Actions

| Shortcut | Command | Description |
|----------|---------|-------------|
| `E` | Download CSV | Downloads current results as CSV (when available) |
| `A` | Add to dashboard | Adds current visualization to dashboard |
| `⌘ S` | Save discover search | Saves the current discover search |

#### Global Dev Tools

| Shortcut | Command | Description |
|----------|---------|-------------|
| `~` | Open global dev console | Opens the browser developer console |


## Supported Keys and Modifiers

### Modifier Keys

OpenSearch Dashboards supports the following modifier combinations in canonical order:

| Type | Combinations | Example |
|------|-------------|---------|
| Single Modifiers | `shift+`, `alt+`, `cmd+` | `Cmd+S` |
| Double Modifiers | `alt+shift+`, `cmd+shift+`, `cmd+alt+` | `Cmd+Shift+Z` |
| Triple Modifiers | `cmd+alt+shift+` | `Cmd+Alt+Shift+I` |

> **Platform Mapping:** `cmd` automatically maps to Command (⌘) on macOS and Ctrl on Windows/Linux.

### Supported Keys

| Category | Keys | Notes |
|----------|------|-------|
| Letters | `a-z` | Case-insensitive, normalized to lowercase |
| Numbers | `0-9` | Main keyboard row only |
| Punctuation | `, - = [ ] ; ' . / \ `` | Common symbols for shortcuts |
| Arrow Keys | `left, up, right, down` | Navigation keys |
| Special Keys | `tab, enter, escape, space, backspace, delete` | Function and control keys |

## Customizing Keyboard Shortcuts

### For Plugin Developers

To register a keyboard shortcut in your plugin:

```javascript
import { useOpenSearchDashboards } from '../opensearch_dashboards_react/public';

function MyComponent() {
  const opensearchDashboards = useOpenSearchDashboards<YourPluginServices>();
  const { keyboardShortcut } = opensearchDashboards.services;

  // Memoized callback to avoid re-registration
  const handleAction = useCallback(() => {
    // Your action logic here
  }, []);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'my_action',
    pluginId: 'myPlugin',
    name: 'My Custom Action',
    category: 'Custom Actions',
    keys: 'cmd+shift+m',
    execute: handleAction,
  });
}
```

### Conditional Registration

Register shortcuts only when certain conditions are met:

```javascript
// Register save shortcut only in edit mode
useEffect(() => {
  if (isEditMode && keyboardShortcut) {
    keyboardShortcut.register({
      id: 'save_dashboard',
      pluginId: 'dashboard',
      name: 'Save Dashboard',
      category: 'editing',
      keys: 'cmd+s',
      execute: handleSave,
    });

    return () => {
      keyboardShortcut.unregister({
        id: 'save_dashboard',
        pluginId: 'dashboard',
      });
    };
  }
}, [isEditMode, keyboardShortcut, handleSave]);
```

> **Important:** Always use memoized callbacks with `useCallback` to prevent unnecessary re-registrations of shortcuts.

## Keyboard Shortcut Categories

Shortcuts are organized into logical categories for better discoverability:

| Category | Description | Examples |
|----------|-------------|----------|
| Navigation | Moving around the interface | Focus query bar, open date picker |
| Search | Query and filtering actions | Execute search, clear filters |
| Data Actions | Data manipulation and export | Download CSV, refresh data |
| Panel / Layout | UI layout and panel management | Toggle edit mode, toggle sidebar |

## Multi-Key Sequences

OpenSearch Dashboards supports GitHub-style multi-key sequences (e.g., `G D`):

```javascript
// Example: 'g d' sequence for "go to dashboard"
keyboardShortcut?.useKeyboardShortcut({
  id: 'go_to_dashboard',
  pluginId: 'navigation',
  name: 'Go to Dashboard',
  category: 'navigation',
  keys: 'g d',  // Two separate key presses
  execute: goToDashboard,
});
```

### Sequence Rules

- Must be exactly two space-separated keys
- First key must be a valid sequence prefix
- Second key must be a single letter (a-z)
- Timeout of 1000ms between key presses

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Shortcut not working | Wrong context or mode | Check if you're in the correct context (e.g., edit mode for save shortcuts) |
| Conflicts | Multiple shortcuts with same key | The last registered shortcut takes precedence |
| Disabled in inputs | Focus in text fields | Shortcuts are disabled when focus is in text inputs, textareas, or contenteditable elements |

### Best Practices

- Use memoized callbacks to prevent unnecessary re-registrations
- Follow naming conventions for consistent categorization
- Test across platforms to ensure modifier keys work correctly
- Avoid conflicts with browser shortcuts (e.g., `Cmd+R` for refresh)
- Provide clear descriptions for the help modal

## API Reference

### ShortcutDefinition Interface

```typescript
interface ShortcutDefinition {
  id: string;           // Unique within plugin
  pluginId: string;     // Plugin namespace
  name: string;         // Human-readable name
  category: string;     // Grouping category
  keys: string;         // Key combination
  execute: () => void;  // Action function
}
```

### KeyboardShortcutService Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `register(shortcut)` | Register a new shortcut | `ShortcutDefinition` |
| `unregister(shortcut)` | Remove a shortcut | `Pick<ShortcutDefinition, 'id' \| 'pluginId'>` |
| `getAllShortcuts()` | Get all registered shortcuts | None |
| `useKeyboardShortcut(shortcut)` | React hook for automatic lifecycle management | `ShortcutDefinition` |

> This keyboard shortcut system provides a powerful, extensible way to enhance user productivity in OpenSearch Dashboards while maintaining consistency and avoiding conflicts across plugins.
