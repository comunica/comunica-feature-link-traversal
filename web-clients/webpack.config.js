// Webpack >= 5.108 auto-enables its built-in TypeScript type-stripping support
// (experiments.typescript = 'auto') whenever Node.js provides `module.stripTypeScriptTypes`
// and no loader is registered for `.ts` files. This causes `.ts` extensions to outrank `.js`
// during module resolution, so imports that used to resolve to the compiled `packages/*/lib/*.js`
// output now resolve directly to the `packages/*/lib/*.ts` sources instead. Those sources rely on
// TypeScript syntax (e.g. constructor parameter properties, angle-bracket type assertions) that
// the strip-only mode does not support, which breaks the build.
//
// We don't compile against those `.ts` sources here (they're built to `.js` beforehand), so this
// experiment is explicitly disabled to keep resolving to the compiled output as before.
const baseConfig = require('@comunica/web-client-generator/webpack.config.js');

for (const entry of baseConfig) {
  entry.experiments = { ...entry.experiments, typescript: false };
}

module.exports = baseConfig;
