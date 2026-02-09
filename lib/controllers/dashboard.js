/**
 * Dashboard controller
 * Admin UI for homepage configuration
 */

import { getConfig, saveConfig, getDefaultConfig } from "../storage/config.js";

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

      // Group sections by source plugin
      const sectionsByPlugin = {};
      for (const section of sections) {
        const source = section.sourcePlugin || "Built-in";
        if (!sectionsByPlugin[source]) {
          sectionsByPlugin[source] = [];
        }
        sectionsByPlugin[source].push(section);
      }

      response.render("homepage-dashboard", {
        title: "Homepage Builder",
        config,
        sections,
        widgets,
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
      const { layout, hero, sections, sidebar, footer, identity } = request.body;

      // Parse JSON strings if needed
      const config = {
        layout: layout || "single-column",
        hero: typeof hero === "string" ? JSON.parse(hero) : hero,
        sections: typeof sections === "string" ? JSON.parse(sections) : sections,
        sidebar: typeof sidebar === "string" ? JSON.parse(sidebar) : sidebar,
        footer: typeof footer === "string" ? JSON.parse(footer) : footer,
        identity: typeof identity === "string" ? JSON.parse(identity) : identity,
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
};
