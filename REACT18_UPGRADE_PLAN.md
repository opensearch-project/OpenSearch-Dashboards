# React 18 Upgrade Implementation Plan

**Issue**: [#11152](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/11152)
**Timeline**: 4-6 weeks
**Risk Level**: Low-Medium

---

## Overview

Upgrade OpenSearch Dashboards from React 16.14.0 to React 18.2.0+ without enabling StrictMode.

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Core Package Updates
- [x] Update `react`: ^16.14.0 → ^18.2.0
- [x] Update `react-dom`: ^16.12.0 → ^18.2.0
- [x] Update `@types/react`: ^16.14.23 → ^18.2.0
- [x] Update `@types/react-dom`: ^16.9.8 → ^18.2.0
- [x] Update `react-test-renderer`: ^16.12.0 → ^18.2.0

### 1.2 TypeScript Considerations
- [x] Verify TypeScript 4.6+ compatibility (updated to 4.6.4)
- [ ] Address `children` prop explicit typing requirement
- [ ] Replace `React.VFC` with `React.FC` where used

### 1.3 Testing Framework Updates
- [x] Update `@testing-library/react`: ^12.1.5 → ^14.0.0+
- [x] Remove `@testing-library/react-hooks` dependency
- [ ] Update 73 files to use `renderHook` from `@testing-library/react`

---

## Phase 2: Third-Party Library Updates (Week 1-2)

### 2.1 High Priority Updates
| Package | Current | Target | Status |
|---------|---------|--------|--------|
| `react-redux` | ^7.2.0 | ^8.0.0+ | [ ] |
| `react-markdown` | ^4.3.1 | ^10.0.0+ | [ ] |
| `react-resize-detector` | ^4.2.0 | ^9.0.0+ | [ ] |

### 2.2 Evaluate & Remove
- [ ] `react-input-range`: Verify usage and remove if unused

### 2.3 Enzyme Adapter Migration
- [x] Replace `enzyme-adapter-react-16` with `@cfaester/enzyme-adapter-react-18`
- [x] Update `src/dev/jest/setup/enzyme.js`

---

## Phase 3: API Migrations (Week 2-4)

### 3.1 ReactDOM.render → createRoot
**Affected**: 83 files (132 occurrences)

```typescript
// Before
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, container);

// After
import { createRoot } from 'react-dom/client';
const root = createRoot(container);
root.render(<App />);
```

#### Core Files
- [ ] `src/core/public/rendering/rendering_service.tsx`
- [ ] `src/core/public/chrome/chrome_service.tsx` (2 occurrences)
- [ ] `src/core/public/core_app/errors/error_application.tsx`
- [ ] `src/core/public/core_app/status/render_app.tsx`
- [ ] `src/core/public/notifications/toasts/error_toast.tsx`
- [ ] `src/core/public/overlays/banners/user_banner_service.tsx`

#### Plugin Files
- [ ] `src/plugins/workspace/public/application.tsx` (7 occurrences)
- [ ] `src/plugins/dashboard/public/application/index.tsx`
- [ ] `src/plugins/discover/public/embeddable/search_embeddable.tsx`
- [ ] `src/plugins/visualize/public/application/index.tsx`
- [ ] `src/plugins/explore/public/application/index.tsx`
- [ ] `src/plugins/data_explorer/public/application.tsx`
- [ ] `src/plugins/dev_tools/public/application.tsx`
- [ ] `src/plugins/management/public/application.tsx`
- [ ] `src/plugins/home/public/application/components/homepage/sections/utils.tsx`
- [ ] (and ~70 more files)

### 3.2 unmountComponentAtNode → root.unmount()
**Affected**: 112 files (179 occurrences)

```typescript
// Before
import ReactDOM from 'react-dom';
ReactDOM.unmountComponentAtNode(container);

// After
root.unmount();
```

**Note**: Requires storing root references for later unmounting

### 3.3 Server Rendering API
- [ ] Update `hydrateRoot` usage if applicable

---

## Phase 4: Test Migration (Week 3-4)

### 4.1 Hook Test Migration (73 files)
```typescript
// Before
import { renderHook } from '@testing-library/react-hooks';

// After
import { renderHook } from '@testing-library/react';
```

### 4.2 waitFor Updates
```typescript
// Before
const { result, waitForNextUpdate } = renderHook(...);
await waitForNextUpdate();

// After
const { result } = renderHook(...);
await waitFor(() => expect(result.current.data).toBeDefined());
```

### 4.3 Enzyme Tests (~492 files)
- [ ] Update adapter configuration
- [ ] Validate all enzyme tests pass with new adapter

---

## Phase 5: Validation & Testing (Week 4-5)

### 5.1 Automated Tests
- [ ] `yarn test:jest` passes
- [ ] `yarn test:jest:ci` passes
- [ ] `yarn test:ftr` passes

### 5.2 Manual Testing Checklist
- [ ] Application bootstrap
- [ ] Plugin loading
- [ ] Overlays (modals, flyouts, sidecars)
- [ ] Toast notifications
- [ ] Embeddables rendering
- [ ] Dashboard functionality
- [ ] Visualizations
- [ ] Workspace functionality
- [ ] Data explorer
- [ ] Dev tools console

---

## Phase 6: Cleanup & Documentation (Week 5-6)

### 6.1 Cleanup
- [ ] Remove React 16 compatibility shims
- [ ] Remove unused polyfills
- [ ] Clean up any temporary migration code

### 6.2 Documentation
- [ ] Update CONTRIBUTING.md
- [ ] Update plugin development guides
- [ ] Document any breaking changes for external plugins

---

## Migration Statistics

| Migration Task | Files | Occurrences |
|----------------|-------|-------------|
| `ReactDOM.render` → `createRoot` | 83 | 132 |
| `unmountComponentAtNode` → `root.unmount()` | 112 | 179 |
| `@testing-library/react-hooks` removal | 73 | - |
| Enzyme adapter update | 19 | - |
| **Total unique files (estimated)** | ~200-250 | - |

---

## Risk Mitigation

1. **No StrictMode** - Avoids refactoring 894 useEffect hooks initially
2. **Community enzyme adapter** - Already validated by OUI 2.0
3. **Incremental testing** - Test after each phase
4. **Feature flags** - Consider for gradual rollout if needed

---

## Dependencies & Blockers

1. [ ] OUI compatibility with React 18 (verify @opensearch-project/oui@1.22.1)
2. [ ] External plugin ecosystem notification
3. [ ] CI/CD pipeline updates for new test dependencies

---

## Progress Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2025-01-14 | Phase 1.1 | Completed | Core packages updated in package.json |
| 2025-01-14 | Phase 1.2 | Completed | TypeScript updated to 4.6.4 |
| 2025-01-14 | Phase 1.3 | Completed | Testing framework packages updated |
| | Phase 2 | Not Started | |
| | Phase 3 | Not Started | |
| | Phase 4 | Not Started | |
| | Phase 5 | Not Started | |
| | Phase 6 | Not Started | |

### Phase 1 Changes Made:
- `package.json`: react/react-dom ^16.14.0 → ^18.2.0
- `package.json`: @types/react/@types/react-dom ^16.x → ^18.2.0
- `package.json`: react-test-renderer ^16.12.0 → ^18.2.0
- `package.json`: typescript 4.5.5 → 4.6.4
- `package.json`: @testing-library/react ^12.1.5 → ^14.0.0
- `package.json`: Removed @testing-library/react-hooks
- `package.json`: enzyme-adapter-react-16 → @cfaester/enzyme-adapter-react-18 ^0.8.0
- `packages/osd-i18n/package.json`: react ^16.14.0 → ^18.2.0
- `packages/osd-ui-framework/package.json`: react ^16.14.0 → ^18.2.0, updated peerDeps
- `packages/osd-ui-shared-deps/package.json`: react/react-dom/react-is → ^18.2.0
- `src/dev/jest/setup/enzyme.js`: Updated adapter import

---

*Last updated: 2025-01-14*
