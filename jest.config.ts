export default {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin/$1',
  },
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node"
};
