/**
 * Homepage configuration storage
 * @module storage/config
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Get collection reference
 * @param {object} application - Application instance
 * @returns {Collection} MongoDB collection
 */
function getCollection(application) {
  const db = application.getHomepageDb();
  return db.collection("homepageConfig");
}

/**
 * Get the current homepage configuration
 * @param {object} application - Application instance
 * @returns {Promise<object|null>} Config or null
 */
export async function getConfig(application) {
  const collection = getCollection(application);
  return collection.findOne({ _id: "homepage" });
}

/**
 * Save homepage configuration
 * @param {object} application - Application instance
 * @param {object} config - Configuration data
 * @returns {Promise<object>} Saved config
 */
export async function saveConfig(application, config) {
  const collection = getCollection(application);
  const now = new Date();

  const document = {
    _id: "homepage",
    layout: config.layout || "single-column",
    hero: config.hero || { enabled: true, showSocial: true },
    sections: config.sections || [],
    sidebar: config.sidebar || [],
    identity: config.identity || null,
    updatedAt: now,
  };

  await collection.replaceOne({ _id: "homepage" }, document, { upsert: true });

  // Write JSON file for Eleventy to pick up
  await writeConfigFile(application, document);

  return document;
}

/**
 * Write configuration to JSON file in content directory
 * This triggers Eleventy rebuild via file watcher
 * @param {object} application - Application instance
 * @param {object} config - Configuration data
 */
async function writeConfigFile(application, config) {
  const contentDir = application.contentDir || "/app/data/content";
  const configDir = join(contentDir, ".indiekit");
  const configPath = join(configDir, "homepage.json");

  // Ensure directory exists
  try {
    mkdirSync(configDir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Write config (excluding MongoDB-specific fields)
  const fileConfig = {
    layout: config.layout,
    hero: config.hero,
    sections: config.sections,
    sidebar: config.sidebar,
    identity: config.identity,
    updatedAt: config.updatedAt,
  };

  writeFileSync(configPath, JSON.stringify(fileConfig, null, 2));
  console.log(`[Homepage] Wrote config to ${configPath}`);
}

/**
 * Get default configuration
 * @returns {object} Default config
 */
export function getDefaultConfig() {
  return {
    layout: "two-column",
    hero: {
      enabled: true,
      showSocial: true,
    },
    sections: [
      {
        type: "recent-posts",
        config: {
          maxItems: 10,
          postTypes: ["note", "article"],
        },
      },
    ],
    sidebar: [
      { type: "author-card", config: {} },
      { type: "recent-posts", config: { maxItems: 5 } },
      { type: "categories", config: {} },
    ],
    identity: null,
  };
}
