import { defineConfig } from "cypress";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: process.env.API_BASE_URL || "https://dummyjson.com",
    specPattern: "cypress/e2e/api/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    retries: { runMode: 2, openMode: 0 },
    setupNodeEvents(on, config) {
      // Example task hooks if you need to seed/cleanup:
      on("task", {
        fileExists(path: string) {
          return fs.existsSync(path);
        }
      });
      return config;
    },
  },
  reporter: "spec",
  viewportWidth: 1200,
  viewportHeight: 800,
});
