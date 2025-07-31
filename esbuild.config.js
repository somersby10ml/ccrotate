import { build } from 'esbuild';

const baseConfig = {
  entryPoints: ['bin/ccrotate.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/cli.js',
  treeShaking: true,
  packages: 'external',
  banner: {
    js: '#!/usr/bin/env node'
  },
  plugins: [
    {
      name: 'remove-shebang',
      setup(build) {
        build.onLoad({ filter: /bin\/ccrotate\.js$/ }, async (args) => {
          const fs = await import('fs');
          const text = await fs.promises.readFile(args.path, 'utf8');
          const withoutShebang = text.replace(/^#!.*\n/, '');
          return {
            contents: withoutShebang,
            loader: 'js'
          };
        });
      }
    }
  ]
};

const buildProduction = () => build({
  ...baseConfig,
  minify: true
});

const buildDevelopment = () => build({
  ...baseConfig,
  sourcemap: true
});

export { buildProduction, buildDevelopment };