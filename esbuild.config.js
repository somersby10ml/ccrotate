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
            ...pkg,
            main: 'cli.js',
            bin: {
              ccrotate: './cli.js'
            },
            files: ['*']
          };
          
          // Remove unnecessary fields for distribution
          delete distPkg.scripts;
          delete distPkg.devDependencies;
          
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