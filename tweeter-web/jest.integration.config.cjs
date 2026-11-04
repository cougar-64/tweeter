const { jest: baseConfig } = require("./package.json");

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
