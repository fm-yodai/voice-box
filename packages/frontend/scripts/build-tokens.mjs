#!/usr/bin/env node
/**
 * Build script for design tokens.
 * Runs Style Dictionary v4 programmatically to generate:
 *   - tokens.css          (light mode CSS Custom Properties)
 *   - tokens-dark.css     (dark mode CSS Custom Properties)
 *   - tailwind-tokens.mjs (Tailwind CSS config values)
 */
import StyleDictionary from "style-dictionary";
import { darkConfig, lightConfig } from "../style-dictionary.config.mjs";

async function build() {
  console.log("Building design tokens...\n");

  // --- Light mode + primitives + components ---
  console.log("[1/2] Building light mode tokens...");
  const sdLight = new StyleDictionary(lightConfig);
  await sdLight.buildAllPlatforms();
  console.log("  -> tokens.css");
  console.log("  -> tailwind-tokens.mjs\n");

  // --- Dark mode ---
  console.log("[2/2] Building dark mode tokens...");
  const sdDark = new StyleDictionary(darkConfig);
  await sdDark.buildAllPlatforms();
  console.log("  -> tokens-dark.css\n");

  console.log("Design tokens built successfully!");
}

build().catch((err) => {
  console.error("Token build failed:", err);
  process.exit(1);
});
