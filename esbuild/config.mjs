
import inlineImportPlugin from 'esbuild-plugin-inline-import';
import { compileString } from 'sass'

const common = {
  target: 'esnext',
  loader: { '.ts': 'ts' },
  // define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
  platform: 'browser',
  plugins: [
    // Always include this plugin before others
    inlineImportPlugin({
      filter: /^sass:/,
      transform: async (contents, args) => {
        return compileString(contents, {
          style: 'compressed',
        }).css;
      }
    }),
  ]
};

export const configs = {
  dev: {
    entryPoints: ['src/app.ts'],
    bundle: true,
    outfile: 'dist/dev.js',
    minify: false,
    sourcemap: 'inline',
    ...common,
  },
  prod: {
    entryPoints: ['src/app.ts'],
    bundle: true,
    outfile: 'dist/prod.js',
    minify: true,
    ...common,
  },
};
