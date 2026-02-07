/**
 * Style Dictionary v4 configuration for voice-box design tokens.
 *
 * Builds DTCG-format tokens into:
 *   1. CSS Custom Properties (light mode + primitives + components)
 *   2. CSS Custom Properties (dark mode, [data-theme="dark"] selector)
 *   3. Tailwind-compatible ESM JS object
 */
import StyleDictionary from "style-dictionary";
import { fileHeader, formattedVariables } from "style-dictionary/utils";

// ---------------------------------------------------------------------------
// Custom format: CSS variables with a configurable selector
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "css/variables-themed",
  format: async ({ dictionary, file, options }) => {
    const { outputReferences, selector = ":root", usesDtcg } = options;
    const header = await fileHeader({ file });
    return (
      header +
      `${selector} {\n` +
      formattedVariables({
        format: "css",
        dictionary,
        outputReferences,
        usesDtcg,
      }) +
      "\n}\n"
    );
  },
});

// ---------------------------------------------------------------------------
// Custom format: Tailwind-compatible ESM export
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "js/tailwind-esm",
  format: async ({ dictionary, file }) => {
    const header = await fileHeader({ file });

    // Build a nested object from the flat token list
    const result = {};
    for (const token of dictionary.allTokens) {
      const category = token.path[0]; // e.g. "color", "spacing", "font", ...
      const rest = token.path.slice(1).join("-"); // kebab-joined subpath

      if (!result[category]) result[category] = {};

      // Use CSS variable reference so Tailwind values stay dynamic
      result[category][rest] = `var(--${token.name})`;
    }

    return `${header}export default ${JSON.stringify(result, null, 2)};\n`;
  },
});

// ---------------------------------------------------------------------------
// Shared options
// ---------------------------------------------------------------------------
const tokensDir = "../../design/tokens";
const outputDir = "src/assets/generated/";

// ---------------------------------------------------------------------------
// Light-mode build configuration
// Sources: primitives + semantic-light + components
// ---------------------------------------------------------------------------
export const lightConfig = {
  source: [
    `${tokensDir}/primitive.tokens.json`,
    `${tokensDir}/semantic-light.tokens.json`,
    `${tokensDir}/component.tokens.json`,
  ],
  usesDtcg: true,
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: outputDir,
      files: [
        {
          destination: "tokens.css",
          format: "css/variables-themed",
          options: {
            outputReferences: true,
            selector: ":root",
          },
        },
      ],
    },
    js: {
      transformGroup: "css",
      buildPath: outputDir,
      files: [
        {
          destination: "tailwind-tokens.mjs",
          format: "js/tailwind-esm",
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Dark-mode build configuration
// Sources: primitives (for reference resolution) + semantic-dark
// Output: only semantic tokens under [data-theme="dark"]
// ---------------------------------------------------------------------------
export const darkConfig = {
  source: [`${tokensDir}/primitive.tokens.json`, `${tokensDir}/semantic-dark.tokens.json`],
  usesDtcg: true,
  platforms: {
    "css-dark": {
      transformGroup: "css",
      buildPath: outputDir,
      files: [
        {
          destination: "tokens-dark.css",
          format: "css/variables-themed",
          filter: (token) => token.path[0] === "semantic",
          options: {
            outputReferences: true,
            selector: '[data-theme="dark"]',
          },
        },
      ],
    },
  },
};
