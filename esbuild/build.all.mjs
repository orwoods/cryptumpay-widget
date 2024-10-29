import * as esbuild from 'esbuild';
import { configs } from './config.mjs';

export const dev = async () => {
  await esbuild.build(configs.dev);
};

export const prod = async () => {
  await esbuild.build(configs.prod);
};

export const watch = async () => {
  const ctx = await esbuild.context(configs.dev);

  await ctx.watch();
};
