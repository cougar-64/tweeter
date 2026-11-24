// AI-assisted: see AI-ATTRIBUTION.md
const fs = require("node:fs");
const path = require("node:path");
const { jest: baseConfig } = require("./package.json");

// A generated local file is an explicit test target. Use it only when none of
// the three settings are supplied, so credentials never mix with another API URL.
const settingNames = ["TWEETER_API_BASE_URL", "TWEETER_FIXTURE_PATH", "TWEETER_TEST_PASSWORD"];
const localConfigPath = path.resolve(__dirname, "../milestone4-fixtures/live-config.json");
if (!settingNames.some((name) => process.env[name] !== undefined) && fs.existsSync(localConfigPath)) {
  const { environment } = JSON.parse(fs.readFileSync(localConfigPath, "utf8"));
  for (const name of settingNames) {
    if (typeof environment?.[name] !== "string" || !environment[name]) {
      throw new Error(`Missing ${name} in local live test configuration.`);
    }
  }
  for (const name of settingNames) process.env[name] = environment[name];
}

module.exports = {
  ...baseConfig,
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/integration/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    ...baseConfig.transform,
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { types: ["node", "jest"] } }],
  },
  testTimeout: 60000,
};
