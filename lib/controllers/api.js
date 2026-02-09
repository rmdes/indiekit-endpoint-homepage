/**
 * API controller
 * JSON endpoints for homepage configuration
 */

import { getConfig, getDefaultConfig } from "../storage/config.js";

export const apiController = {
  /**
   * GET /api/sections - List all available sections
   */
  async listSections(request, response) {
    const { application } = request.app.locals;

    try {
      const sections = application.discoveredSections || [];
      response.json({
        success: true,
        sections,
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  /**
   * GET /api/widgets - List all available widgets
   */
  async listWidgets(request, response) {
    const { application } = request.app.locals;

    try {
      const widgets = application.discoveredWidgets || [];
      response.json({
        success: true,
        widgets,
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  /**
   * GET /api/config - Get current configuration (protected)
   */
  async getConfig(request, response) {
    const { application } = request.app.locals;

    try {
      let config = await getConfig(application);
      if (!config) {
        config = getDefaultConfig();
      }

      response.json({
        success: true,
        config,
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  /**
   * GET /api/config.json - Public config endpoint for Eleventy
   */
  async getConfigPublic(request, response) {
    const { application } = request.app.locals;

    try {
      let config = await getConfig(application);
      if (!config) {
        // Return null to indicate no config exists
        response.json(null);
        return;
      }

      // Return config without MongoDB-specific fields
      response.json({
        layout: config.layout,
        hero: config.hero,
        sections: config.sections,
        sidebar: config.sidebar,
        footer: config.footer,
        identity: config.identity,
        updatedAt: config.updatedAt,
      });
    } catch (error) {
      // On error, return null (Eleventy will use fallback)
      console.error("[Homepage] Config fetch error:", error);
      response.json(null);
    }
  },
};
