import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { dashboardController } from "./lib/controllers/dashboard.js";
import { apiController } from "./lib/controllers/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const protectedRouter = express.Router();
const publicRouter = express.Router();

const defaults = {
  mountPath: "/homepage",
  contentDir: "/app/data/content",
};

export default class HomepageEndpoint {
  name = "Homepage builder endpoint";

  constructor(options = {}) {
    this.options = { ...defaults, ...options };
    this.mountPath = this.options.mountPath;
  }

  get localesDirectory() {
    return path.join(__dirname, "locales");
  }

  get viewsDirectory() {
    return path.join(__dirname, "views");
  }

  get navigationItems() {
    return {
      href: this.options.mountPath,
      text: "homepage.title",
      requiresDatabase: true,
    };
  }

  get shortcutItems() {
    return {
      url: this.options.mountPath,
      name: "homepage.title",
      iconName: "home",
      requiresDatabase: true,
    };
  }

  /**
   * Layout presets — quick-start configurations for common homepage styles
   */
  get layoutPresets() {
    return [
      {
        id: "blog",
        label: "Blog",
        description: "Recent posts front and center",
        icon: "newspaper",
        layout: "two-column",
        hero: { enabled: true, showSocial: true },
        sections: [
          { type: "hero", config: {} },
          { type: "recent-posts", config: { maxItems: 15 } },
        ],
        sidebar: [
          { type: "search", config: {} },
          { type: "author-card", config: {} },
          { type: "social-activity", config: {} },
          { type: "recent-posts", config: { maxItems: 5 } },
        ],
        footer: [],
      },
      {
        id: "cv",
        label: "CV / Portfolio",
        description: "Professional profile with experience and projects",
        icon: "briefcase",
        layout: "full-width-hero",
        hero: { enabled: true, showSocial: true },
        sections: [
          { type: "hero", config: {} },
          { type: "cv-experience", config: {} },
          { type: "cv-skills", config: {} },
          { type: "cv-projects", config: {} },
          { type: "cv-education", config: {} },
          { type: "cv-interests", config: {} },
        ],
        sidebar: [
          { type: "search", config: {} },
          { type: "social-activity", config: {} },
          { type: "github-repos", config: {} },
          { type: "blogroll", config: {} },
          { type: "recent-posts", config: {} },
          { type: "funkwhale", config: {} },
          { type: "author-card", config: {} },
        ],
        footer: [],
      },
      {
        id: "hybrid",
        label: "Hybrid",
        description: "Blog posts with CV highlights",
        icon: "layout",
        layout: "two-column",
        hero: { enabled: true, showSocial: true },
        sections: [
          { type: "hero", config: {} },
          { type: "cv-experience", config: { maxItems: 3 } },
          { type: "recent-posts", config: { maxItems: 10 } },
          { type: "cv-projects", config: { maxItems: 3 } },
        ],
        sidebar: [
          { type: "search", config: {} },
          { type: "author-card", config: {} },
          { type: "social-activity", config: {} },
          { type: "github-repos", config: {} },
          { type: "blogroll", config: {} },
        ],
        footer: [],
      },
    ];
  }

  /**
   * Built-in section types (always available)
   */
  get homepageSections() {
    return [
      {
        id: "hero",
        label: "Hero Section",
        description: "Author intro with avatar, name, title, and bio",
        icon: "user",
        dataEndpoint: null, // Uses site config, no API call needed
        defaultConfig: {
          showAvatar: true,
          showSocialLinks: true,
        },
        configSchema: {
          showAvatar: { type: "boolean", label: "Show avatar" },
          showSocialLinks: { type: "boolean", label: "Show social links" },
        },
      },
      {
        id: "recent-posts",
        label: "Recent Posts",
        description: "Latest posts from your blog",
        icon: "file-text",
        dataEndpoint: null, // Uses Eleventy collections
        defaultConfig: {
          maxItems: 10,
          postTypes: ["note", "article", "photo", "bookmark"],
        },
        configSchema: {
          maxItems: { type: "number", label: "Max items", min: 1, max: 50 },
          postTypes: { type: "array", label: "Post types to include" },
        },
      },
      {
        id: "custom-html",
        label: "Custom Content",
        description: "Freeform HTML or Markdown block",
        icon: "code",
        dataEndpoint: null,
        defaultConfig: {
          content: "",
        },
        configSchema: {
          content: { type: "textarea", label: "Content (HTML/Markdown)" },
        },
      },
    ];
  }

  /**
   * Built-in sidebar widget types
   */
  get homepageWidgets() {
    return [
      {
        id: "author-card",
        label: "Author Card",
        description: "h-card with author info",
        icon: "user",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "recent-posts",
        label: "Recent Posts",
        description: "Latest posts sidebar",
        icon: "file-text",
        defaultConfig: { maxItems: 5 },
        configSchema: {
          maxItems: { type: "number", label: "Max items", min: 1, max: 20 },
        },
      },
      {
        id: "categories",
        label: "Categories",
        description: "Tag cloud",
        icon: "tag",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "search",
        label: "Search",
        description: "Site search box",
        icon: "search",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "social-activity",
        label: "Social Activity",
        description: "Bluesky and Mastodon feeds",
        icon: "message-circle",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "github-repos",
        label: "GitHub Projects",
        description: "GitHub repositories and activity",
        icon: "github",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "funkwhale",
        label: "Listening",
        description: "Funkwhale now playing and stats",
        icon: "music",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "blogroll",
        label: "Blogroll",
        description: "Blog recommendations",
        icon: "list",
        defaultConfig: {},
        configSchema: {},
      },
      {
        id: "custom-html",
        label: "Custom Content",
        description: "Freeform HTML or text block",
        icon: "code",
        defaultConfig: {
          title: "",
          content: "",
        },
        configSchema: {
          title: { type: "text", label: "Title (optional)" },
          content: { type: "textarea", label: "Content (HTML)" },
        },
      },
    ];
  }

  /**
   * Protected routes (require authentication)
   */
  get routes() {
    // Dashboard - main admin UI
    protectedRouter.get("/", dashboardController.get);

    // Save configuration
    protectedRouter.post("/save", dashboardController.save);

    // Apply a layout preset
    protectedRouter.post("/apply-preset", dashboardController.applyPreset);

    // Get available sections (for section picker)
    protectedRouter.get("/api/sections", apiController.listSections);

    // Get available widgets
    protectedRouter.get("/api/widgets", apiController.listWidgets);

    // Get current config
    protectedRouter.get("/api/config", apiController.getConfig);

    return protectedRouter;
  }

  /**
   * Public routes (no authentication required)
   */
  get routesPublic() {
    // Public API for Eleventy to fetch config
    publicRouter.get("/api/config.json", apiController.getConfigPublic);

    return publicRouter;
  }

  init(Indiekit) {
    Indiekit.addEndpoint(this);

    // Add MongoDB collection for homepage config
    Indiekit.addCollection("homepageConfig");

    // Store config in application for controller access
    Indiekit.config.application.homepageConfig = this.options;
    Indiekit.config.application.homepageEndpoint = this.mountPath;

    // Store layout presets for dashboard access
    Indiekit.config.application.layoutPresets = this.layoutPresets;

    // Store content directory path
    Indiekit.config.application.contentDir =
      this.options.contentDir ||
      process.env.CONTENT_DIR ||
      "/app/data/content";

    // Store database getter for controller access
    Indiekit.config.application.getHomepageDb = () => Indiekit.database;

    // Store reference to Indiekit for plugin discovery
    Indiekit.config.application.indiekitInstance = Indiekit;

    // Defer discovery until after all plugins have called init()
    // (process.nextTick runs after the synchronous plugin loading loop)
    const self = this;
    process.nextTick(() => self._discoverPluginSections(Indiekit));
  }

  /**
   * Discover homepageSections and homepageWidgets from all loaded plugins
   */
  _discoverPluginSections(Indiekit) {
    const discoveredSections = [...this.homepageSections];
    const discoveredWidgets = [...this.homepageWidgets];

    // Scan all endpoints for homepageSections
    for (const endpoint of Indiekit.endpoints || []) {
      if (endpoint === this) continue; // Skip self

      if (endpoint.homepageSections) {
        for (const section of endpoint.homepageSections) {
          // Add source plugin info
          discoveredSections.push({
            ...section,
            sourcePlugin: endpoint.name,
          });
        }
      }

      if (endpoint.homepageWidgets) {
        for (const widget of endpoint.homepageWidgets) {
          discoveredWidgets.push({
            ...widget,
            sourcePlugin: endpoint.name,
          });
        }
      }
    }

    // Store discovered sections/widgets for API access
    Indiekit.config.application.discoveredSections = discoveredSections;
    Indiekit.config.application.discoveredWidgets = discoveredWidgets;

    console.log(
      `[Homepage] Discovered ${discoveredSections.length} sections, ${discoveredWidgets.length} widgets`
    );
  }
}
