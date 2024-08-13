# Plugin for managing dynamic page creation in OSD
Use this plugin to create pages that multiple plugins can contribute to. A typical use case is the OSD homepage,
which can have contents contributed by different plugins, see the screenshot:

![image](https://github.com/user-attachments/assets/501c2433-38c5-4b53-9974-de6f63eab94d)

## Getting started
### Step 1: Add `contentManagement` to `requiredPlugins`
Ensure `contentManagement` is listed in the `requiredPlugins` array of your plugin's manifest file.
```json
{
  "requiredPlugins": ["contentManagement"]
}
```

### Step 2: Create a page with defined sections
A section is typically a container on the page, and a page could have multiple sections. Using the homepage as an example:
```typescript
export const HOME_PAGE_ID = 'osd_homepage';
export enum SECTIONS {
  GET_STARTED = `get_started`,
  SERVICE_CARDS = `service_cards`,
  RECENTLY_VIEWED = `recently_viewed`,
}

export class MyPlugin implements Plugin {
  public setup(core, { contentManagement }) {
    contentManagement.registerPage({
      id: HOME_PAGE_ID,
      title: 'Home',
      sections: [
        {
          id: SECTIONS.SERVICE_CARDS,
          order: 3000,
          kind: 'dashboard',
        },
        {
          id: SECTIONS.RECENTLY_VIEWED,
          order: 2000,
          title: 'Recently viewed',
          kind: 'custom',
          render: (contents) => (
            <>
              {contents.map((content) => content.kind === 'custom' ? content.render() : null)}
            </>
          ),
        },
        {
          id: SECTIONS.GET_STARTED,
          order: 1000,
          title: 'Define your path forward with OpenSearch',
          kind: 'card',
        },
      ],
    });
  }
}
```
Here we defined a page with three different kinds of sections: `dashboard`, `custom` and `card`, the sections will be sorted by `order` in ascending order.
Each type of section serves a different purpose:

#### `card` section
A `card` section is one of the pre-defined section type that renders a horizontal list of OuiCard components, to add
contents to a `card` section, call `contentManagement.registerContentProvider` with a `title` and `description`, and the content
will be sorted by its `order` in ascending order.
```typescript
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `home_get_start`, // id for the content provider, could be any unique string
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.GET_STARTED}`, // target area follow the convention: {page_id}/{section_id}
      getContent: () => ({
        id: 'card_content_id', // id for the content, could be any unique string
        kind: 'card',
        order: 1000,
        description: 'Card description',
        title: 'Card title'
      }),
    });
  }
}
```

#### `dashboard` section
A `dashboard` section is typically a dashboard embeddable container, it can render visualization or dashboard by their id,
or it can render arbitrary React components.

Add a saved visualization to a `dashboard` section **statically**
```typescript
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `visualization_content_provider`,
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.SERVICE_CARDS}`,
      getContent: () => ({
        id: 'visualization_content_id', // id for the content, could be any unique string
        kind: 'visualization',
        order: 1000,
        input: {
          kind: 'static',
          id: 'c0ba29f0-eb8f-11ed-8e00-17d7d50cd7b2' // the visualization id
        }
      }),
    });
  }
}
```

Add a saved visualization to a `dashboard` section **dynamically**
```diff
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `visualization_content_provider`,
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.SERVICE_CARDS}`,
      getContent: () => ({
        id: 'visualization_content_id',
        kind: 'visualization', // with `visualization` kind
        order: 1000,
        input: {
-          kind: 'static',
-          id: 'c0ba29f0-eb8f-11ed-8e00-17d7d50cd7b2' // the visualization id
+          kind: 'dynamic',
+          get: () => Promise.resolve('c0ba29f0-eb8f-11ed-8e00-17d7d50cd7b2') // the visualization id
        }
      }),
    });
  }
}
```

Add a saved dashboard to a `dashboard` section **statically**
```typescript
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `dashboard_content_provider`,
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.SERVICE_CARDS}`,
      getContent: () => ({
        id: 'dashboard_content_id',
        kind: 'dashboard', // with `dashboard` kind
        order: 1000,
        input: {
          kind: 'static',
          id: 'c39012d0-eb7a-11ed-8e00-17d7d50cd7b2' // the saved dashboard id
        }
      }),
    });
  }
}
```

Similarly, you can add a saved dashboard to a `dashboard` section **dynamically**
```diff
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `dashboard_content_provider`,
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.SERVICE_CARDS}`,
      getContent: () => ({
        id: 'dashboard_content_id',
        kind: 'dashboard', // with `dashboard` kind
        order: 1000,
        input: {
-          kind: 'static',
-          id: 'c39012d0-eb7a-11ed-8e00-17d7d50cd7b2' // the saved dashboard id
+          kind: 'dynamic',
+          get: () => Promise.resolve('c39012d0-eb7a-11ed-8e00-17d7d50cd7b2') // the saved dashboard id
        }
      }),
    });
  }
}
```

You can also add custom components to a `dashboard` section
```typescript
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: `custom_content_provider`,
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.SERVICE_CARDS}`,
      getContent: () => ({
        id: 'custom_content_id',
        kind: 'custom', // with `dashboard` kind
        order: 1000,
        render: () => <MyComponent />
      }),
    });
  }
}
```

#### `custom` section
If the existing pre-defined sections do not meet your needs, you could use `custom` section to customize the rendering of the contents,
a custom section is typically defined with `kind: 'custom'` and a `render` function:
```typescript
{
  id: SECTIONS.RECENTLY_VIEWED,
  order: 2000,
  title: 'Recently viewed',
  kind: 'custom',
  render: (contents) => (
    <>
      {contents.map((content) => content.kind === 'custom' ? content.render() : null)}
    </>
  ),
}
```

Now adds content to a `custom` section
```typescript
export class MyPlugin implements Plugin {
  public start(core, { contentManagement }) {
    contentManagement.registerContentProvider({
      id: 'recent_provider_id',
      getContent: () => {
        return {
          order: 1,
          id: 'recent_content_id',
          kind: 'custom',
          render: () => <RecentWork />,
        };
      },
      getTargetArea: () => `${HOME_PAGE_ID}/${SECTIONS.RECENTLY_VIEWED}`,
    });
  }
}
```

### Step 3: Render the page
Finally, render the page in your application:
```typescript
<Route exact path="/">
  {contentManagement.renderPage(HOME_PAGE_ID)}
</Route>
```
