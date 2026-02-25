/**
 * Dashboard controller
 * Admin UI for homepage configuration
 */

import { getConfig, saveConfig, getDefaultConfig } from "../storage/config.js";

/**
 * Parse social links from form body.
 * Express parses social[0][name], social[0][url] etc. into nested objects.
 */
function parseSocialLinks(body) {
  const social = [];
  if (!body.social) return social;
  const entries = Array.isArray(body.social) ? body.social : Object.values(body.social);
  for (const entry of entries) {
    if (!entry || (!entry.name && !entry.url)) continue;
    social.push({
      name: entry.name || "",
      url: entry.url || "",
      rel: entry.rel || "me",
      icon: entry.icon || "",
    });
  }
  return social;
}

/**
 * Detect which preset matches the current config (if any)
 */
function detectActivePreset(config, presets) {
  for (const preset of presets) {
    if (config.layout !== preset.layout) continue;

    const configTypes = (config.sections || []).map((s) => s.type).join(",");
    const presetTypes = preset.sections.map((s) => s.type).join(",");
    if (configTypes !== presetTypes) continue;

    const configWidgets = (config.sidebar || []).map((w) => w.type).join(",");
    const presetWidgets = preset.sidebar.map((w) => w.type).join(",");
    if (configWidgets !== presetWidgets) continue;

    return preset.id;
  }
  return null;
}

export const dashboardController = {
  /**
   * GET / - Main dashboard
   */
  async get(request, response) {
    const { application } = request.app.locals;

    try {
      // Get current config or defaults
      let config = await getConfig(application);
      if (!config) {
        config = getDefaultConfig();
      }

      // Get discovered sections and widgets
      const sections = application.discoveredSections || [];
      const widgets = application.discoveredWidgets || [];
      const blogPostWidgets = application.discoveredBlogPostWidgets || [];
      const presets = application.layoutPresets || [];

      // Group sections by source plugin
      const sectionsByPlugin = {};
      for (const section of sections) {
        const source = section.sourcePlugin || "Built-in";
        if (!sectionsByPlugin[source]) {
          sectionsByPlugin[source] = [];
        }
        sectionsByPlugin[source].push(section);
      }

      // Detect which preset is active (if any)
      const activePresetId = detectActivePreset(config, presets);

      response.render("homepage-dashboard", {
        title: "Homepage Builder",
        activeTab: "builder",
        config,
        sections,
        widgets,
        blogPostWidgets,
        presets,
        activePresetId,
        sectionsByPlugin,
        homepageEndpoint: application.homepageEndpoint,
        layouts: [
          { id: "single-column", label: "Single Column" },
          { id: "two-column", label: "Two Column with Sidebar" },
          { id: "full-width-hero", label: "Full-width Hero + Grid" },
        ],
      });
    } catch (error) {
      console.error("[Homepage] Dashboard error:", error);
      response.status(500).render("error", {
        title: "Error",
        message: "Failed to load homepage configuration",
        error: error.message,
      });
    }
  },

  /**
   * POST /save - Save configuration
   */
  async save(request, response) {
    const { application } = request.app.locals;

    try {
      const { layout, hero, sections, sidebar, footer } = request.body;

      // Get current config to preserve fields from other tabs
      const currentConfig = await getConfig(application);

      // Parse JSON strings if needed
      const config = {
        layout: layout || "single-column",
        hero: typeof hero === "string" ? JSON.parse(hero) : hero,
        sections: typeof sections === "string" ? JSON.parse(sections) : sections,
        sidebar: typeof sidebar === "string" ? JSON.parse(sidebar) : sidebar,
        blogListingSidebar: currentConfig?.blogListingSidebar || [],
        blogPostSidebar: currentConfig?.blogPostSidebar || [],
        footer: typeof footer === "string" ? JSON.parse(footer) : footer,
        identity: currentConfig?.identity || null,
      };

      await saveConfig(application, config);

      // Return success with redirect or JSON based on request type
      if (request.headers.accept?.includes("application/json")) {
        response.json({ success: true, message: "Configuration saved" });
      } else {
        response.redirect(application.homepageEndpoint + "?saved=1");
      }
    } catch (error) {
      console.error("[Homepage] Save error:", error);

      if (request.headers.accept?.includes("application/json")) {
        response.status(500).json({ success: false, error: error.message });
      } else {
        response.status(500).render("error", {
          title: "Error",
          message: "Failed to save configuration",
          error: error.message,
        });
      }
    }
  },

  /**
   * POST /apply-preset - Apply a layout preset
   */
  async applyPreset(request, response) {
    const { application } = request.app.locals;

    try {
      const { presetId } = request.body;
      const presets = application.layoutPresets || [];
      const preset = presets.find((p) => p.id === presetId);

      if (!preset) {
        return response.status(400).redirect(
          application.homepageEndpoint + "?error=unknown-preset"
        );
      }

      // Get current config to preserve footer (webrings etc.)
      const currentConfig = await getConfig(application);
      const existingFooter = currentConfig?.footer || [];

      const config = {
        layout: preset.layout,
        hero: { ...preset.hero },
        sections: preset.sections.map((s) => ({ ...s })),
        sidebar: preset.sidebar.map((w) => ({ ...w })),
        footer: existingFooter,
      };

      await saveConfig(application, config);

      console.log(`[Homepage] Applied preset: ${preset.label}`);
      response.redirect(application.homepageEndpoint + "?saved=1");
    } catch (error) {
      console.error("[Homepage] Apply preset error:", error);
      response.status(500).render("error", {
        title: "Error",
        message: "Failed to apply preset",
        error: error.message,
      });
    }
  },

  /**
   * GET /blog-sidebar - Blog sidebar tab
   */
  async getBlogSidebar(request, response) {
    const { application } = request.app.locals;

    try {
      let config = await getConfig(application);
      if (!config) {
        config = getDefaultConfig();
      }

      const widgets = application.discoveredWidgets || [];
      const blogPostWidgets = application.discoveredBlogPostWidgets || [];

      response.render("homepage-blog-sidebar", {
        title: "Homepage Builder",
        activeTab: "blog-sidebar",
        config,
        widgets,
        blogPostWidgets,
        homepageEndpoint: application.homepageEndpoint,
      });
    } catch (error) {
      console.error("[Homepage] Blog sidebar error:", error);
      response.status(500).render("error", {
        title: "Error",
        message: "Failed to load blog sidebar configuration",
        error: error.message,
      });
    }
  },

  /**
   * POST /save-blog-sidebar - Save blog sidebar configuration
   */
  async saveBlogSidebar(request, response) {
    const { application } = request.app.locals;

    try {
      const { blogListingSidebar, blogPostSidebar } = request.body;

      // Get current config to preserve fields from other tabs
      const currentConfig = await getConfig(application);

      const config = {
        layout: currentConfig?.layout || "single-column",
        hero: currentConfig?.hero || { enabled: true, showSocial: true },
        sections: currentConfig?.sections || [],
        sidebar: currentConfig?.sidebar || [],
        blogListingSidebar: typeof blogListingSidebar === "string" ? JSON.parse(blogListingSidebar) : (blogListingSidebar || []),
        blogPostSidebar: typeof blogPostSidebar === "string" ? JSON.parse(blogPostSidebar) : (blogPostSidebar || []),
        footer: currentConfig?.footer || [],
        identity: currentConfig?.identity || null,
      };

      await saveConfig(application, config);

      if (request.headers.accept?.includes("application/json")) {
        response.json({ success: true, message: "Blog sidebar saved" });
      } else {
        response.redirect(application.homepageEndpoint + "/blog-sidebar?saved=1");
      }
    } catch (error) {
      console.error("[Homepage] Save blog sidebar error:", error);

      if (request.headers.accept?.includes("application/json")) {
        response.status(500).json({ success: false, error: error.message });
      } else {
        response.status(500).render("error", {
          title: "Error",
          message: "Failed to save blog sidebar configuration",
          error: error.message,
        });
      }
    }
  },

  /**
   * GET /identity - Identity editor tab
   */
  async getIdentity(request, response) {
    const { application } = request.app.locals;

    try {
      let config = await getConfig(application);
      if (!config) {
        config = getDefaultConfig();
      }

      const identity = config.identity || {};

      response.render("homepage-identity", {
        title: "Homepage Builder",
        activeTab: "identity",
        identity,
        homepageEndpoint: application.homepageEndpoint,
      });
    } catch (error) {
      console.error("[Homepage] Identity error:", error);
      response.status(500).render("error", {
        title: "Error",
        message: "Failed to load identity configuration",
        error: error.message,
      });
    }
  },

  /**
   * POST /save-identity - Save identity configuration
   */
  async saveIdentity(request, response) {
    const { application } = request.app.locals;

    try {
      const body = request.body;

      // Build identity object from form fields
      const identity = {
        name: body["identity-name"] || "",
        avatar: body["identity-avatar"] || "",
        title: body["identity-title"] || "",
        pronoun: body["identity-pronoun"] || "",
        bio: body["identity-bio"] || "",
        description: body["identity-description"] || "",
        locality: body["identity-locality"] || "",
        country: body["identity-country"] || "",
        org: body["identity-org"] || "",
        url: body["identity-url"] || "",
        email: body["identity-email"] || "",
        keyUrl: body["identity-keyUrl"] || "",
        categories: body["identity-categories"]
          ? (typeof body["identity-categories"] === "string"
            ? body["identity-categories"].split(",").map(s => s.trim()).filter(Boolean)
            : body["identity-categories"])
          : [],
        social: parseSocialLinks(body),
      };

      // Get current config to preserve fields from other tabs
      const currentConfig = await getConfig(application);

      const config = {
        layout: currentConfig?.layout || "single-column",
        hero: currentConfig?.hero || { enabled: true, showSocial: true },
        sections: currentConfig?.sections || [],
        sidebar: currentConfig?.sidebar || [],
        blogListingSidebar: currentConfig?.blogListingSidebar || [],
        blogPostSidebar: currentConfig?.blogPostSidebar || [],
        footer: currentConfig?.footer || [],
        identity,
      };

      await saveConfig(application, config);

      if (request.headers.accept?.includes("application/json")) {
        response.json({ success: true, message: "Identity saved" });
      } else {
        response.redirect(application.homepageEndpoint + "/identity?saved=1");
      }
    } catch (error) {
      console.error("[Homepage] Save identity error:", error);

      if (request.headers.accept?.includes("application/json")) {
        response.status(500).json({ success: false, error: error.message });
      } else {
        response.status(500).render("error", {
          title: "Error",
          message: "Failed to save identity configuration",
          error: error.message,
        });
      }
    }
  },
};
