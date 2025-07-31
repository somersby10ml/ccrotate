import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

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
      name: 'clean-and-prepare',
      setup(build) {
        build.onStart(() => {
          // Clean dist directory
          if (fs.existsSync('dist')) {
            fs.rmSync('dist', { recursive: true, force: true });
          }
          fs.mkdirSync('dist', { recursive: true });
        });
      }
    },
    {
      name: 'remove-shebang',
      setup(build) {
        build.onLoad({ filter: /bin\/ccrotate\.js$/ }, async (args) => {
          const text = await fs.promises.readFile(args.path, 'utf8');
          const withoutShebang = text.replace(/^#!.*\n/, '');
          return {
            contents: withoutShebang,
            loader: 'js'
          };
        });
      }
    },
    {
      name: 'copy-files',
      setup(build) {
        build.onEnd(() => {
          // Copy necessary files
          const filesToCopy = ['LICENSE', 'README.md'];
          
          filesToCopy.forEach(file => {
            if (fs.existsSync(file)) {
              fs.copyFileSync(file, path.join('dist', file));
            }
          });
          
          // Create optimized package.json
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          const distPkg = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            keywords: pkg.keywords,
            homepage: pkg.homepage,
            bugs: pkg.bugs,
            repository: pkg.repository,
            license: pkg.license,
            author: pkg.author,
            type: pkg.type,
            main: 'cli.js',
            bin: {
              ccrotate: './cli.js'
            },
            files: ['*'],
            engines: pkg.engines,
            packageManager: pkg.packageManager
          };
          
          fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));
          
          console.log('\n✅ Build completed! Files copied to dist/');
          console.log('📦 Ready for publishing from dist/ directory');
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