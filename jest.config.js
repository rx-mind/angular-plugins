const { getJestProjects } = require('@nrwl/jest');

module.exports = {
  projects: [
    ...getJestProjects(),
    '<rootDir>/libs/entity-component-store',
    '<rootDir>/libs/data-component-store',
    '<rootDir>/libs/component-store-helpers',
    '<rootDir>/apps/examples/data-cs-crud',
    '<rootDir>/apps/examples/data-cs-search',
    '<rootDir>/apps/examples/data-cs-pagination',
  ],
};
