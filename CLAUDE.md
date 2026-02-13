# CLAUDE.md - Homepage Builder Endpoint

## Package Overview

`@rmdes/indiekit-endpoint-homepage` - Homepage builder endpoint for Indiekit. Provides an admin UI for configuring homepage layout (single-column, two-column, full-width hero), arranging content sections, sidebar widgets, and footer columns through a drag-and-drop interface.

## Architecture

**Entry Point:** `index.js` - HomepageEndpoint class exports plugin with route registration, MongoDB collection setup, and plugin discovery mechanism.

**Data Flow:**
```
Admin UI (dashboard.njk + client JS)
  -> POST /homepage/save (dashboard controller)
  -> saveConfig() (storage/config.js)
  -> MongoDB homepageConfig collection + JSON file write
  -> /app/data/content/.indiekit/homepage.json (triggers Eleventy rebuild)
  -> Eleventy reads JSON -> renders homepage with configured sections
```

**Plugin Discovery:**
```
HomepageEndpoint.init()
  -> process.nextTick() defers _discoverPluginSections()
  -> Scans Indiekit.endpoints for homepageSections/homepageWidgets
  -> Stores in application.discoveredSections/discoveredWidgets
  -> Dashboard UI fetches via /api/sections and /api/widgets
```

## Key Files

| File | Purpose |
|------|---------|
| `index.js` | Plugin class - routes, discovery, built-in sections/widgets |
| `lib/controllers/dashboard.js` | Dashboard UI controller - GET/POST handlers, preset detection |
| `lib/controllers/api.js` | JSON API endpoints - sections list, widgets list, config |
| `lib/storage/config.js` | MongoDB operations + JSON file writes for Eleventy |
| `views/homepage-dashboard.njk` | Admin UI template with inline JS for drag-drop interaction |
| `locales/en.json` | i18n strings for UI |

## Data Model

**MongoDB Collection:** `homepageConfig`

**Document Structure:**
```javascript
{
  _id: "homepage",  // Singleton document
  layout: "two-column" | "single-column" | "full-width-hero",
  hero: {
    enabled: true,
    showSocial: true
  },
  sections: [
    { type: "hero", config: {} },
    { type: "recent-posts", config: { maxItems: 10 } },
    { type: "cv-experience", config: {} }
  ],
  sidebar: [
    { type: "author-card", config: {} },
    { type: "search", config: {} },
    { type: "blogroll", config: {} }
  ],
  footer: [
    { type: "custom-html", config: { title: "Webring", content: "<a>...</a>" } }
  ],
  identity: null,  // Reserved for future use
  updatedAt: Date  // ISO 8601 string
}
```

**JSON File:** `/app/data/content/.indiekit/homepage.json` - Same structure as MongoDB doc (minus `_id`). Written by `writeConfigFile()` after every save to trigger Eleventy file watcher.

## Routes

### Protected (require authentication)

- `GET /homepage` - Dashboard UI
- `POST /homepage/save` - Save configuration
- `POST /homepage/apply-preset` - Apply a preset (blog/cv/hybrid)
- `GET /homepage/api/sections` - List all discovered sections
- `GET /homepage/api/widgets` - List all discovered widgets
- `GET /homepage/api/config` - Get current config (JSON)

### Public (no authentication)

- `GET /homepage/api/config.json` - Public config endpoint for Eleventy data files

## Plugin Discovery Mechanism

HomepageEndpoint scans all loaded Indiekit endpoints for `homepageSections` and `homepageWidgets` properties. Discovery timing uses `process.nextTick()` in `init()` to ensure it happens AFTER all plugins have registered.

**Section/Widget Schema:**
- `id` - Unique identifier (used in config)
- `label` - Display name in UI
- `description` - Help text
- `icon` - Icon name (not currently rendered)
- `dataEndpoint` - API endpoint for data (null = uses Eleventy collections)
- `defaultConfig` - Default config values
- `configSchema` - Form field definitions (not yet implemented in UI)
- `sourcePlugin` - Added during discovery

## Built-in Sections

- `hero` - Author intro with avatar, name, bio
- `recent-posts` - Latest posts from Eleventy collections
- `custom-html` - Freeform HTML/Markdown block

## Built-in Widgets

- `author-card` - h-card with author info
- `recent-posts` - Latest posts sidebar
- `categories` - Tag cloud
- `search` - Site search box
- `social-activity` - Bluesky/Mastodon feeds
- `github-repos` - GitHub projects
- `funkwhale` - Listening activity
- `blogroll` - Blog recommendations
- `custom-html` - Freeform HTML block

## Layout Presets

1. **Blog** - Recent posts front-and-center with sidebar
2. **CV / Portfolio** - Experience/skills/projects with wide sidebar
3. **Hybrid** - Blog posts + CV highlights

## Configuration

**Options in indiekit.config.js:**
```javascript
{
  mountPath: "/homepage",
  contentDir: "/app/data/content"
}
```

## Inter-Plugin Relationships

**Plugins providing sections/widgets:**
- indiekit-endpoint-cv (cv-experience, cv-skills, cv-education, cv-projects, cv-interests)
- indiekit-endpoint-github
- indiekit-endpoint-funkwhale
- indiekit-endpoint-lastfm
- indiekit-endpoint-blogroll
- indiekit-endpoint-microsub
- indiekit-endpoint-podroll
- indiekit-endpoint-youtube

**Consumes config:** indiekit-eleventy-theme reads the homepage.json to render the homepage.

## Client-Side Patterns

The UI uses `createElement()`, `textContent`, `appendChild()` exclusively for safe DOM manipulation. State is managed via hidden JSON inputs that are re-rendered to visible DOM after each modification. Never use unsafe HTML string assignment patterns.

## Known Patterns

1. **DOM re-render requirement** - Always call update functions after modifying data arrays
2. **Discovery timing** - Must use `process.nextTick()` for plugin discovery
3. **Footer limit** - Hardcoded to 3 columns
4. **Preset detection** - Strict matching on type order
5. **Eleventy rebuild** - File watcher triggers rebuild automatically in Cloudron

## Commands

```bash
npm install @rmdes/indiekit-endpoint-homepage
```
