// @ts-check
import { argv } from 'node:process'
import { build, context } from 'esbuild'

// 解析命令行参数
const watchMode = argv.includes('--watch')
const sourcemap = argv.includes('--sourcemap')

main()

async function main() {
  /** @type {import('esbuild').BuildOptions} */
  const config = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: !watchMode, // 开发时不压缩
    sourcemap: sourcemap ? 'linked' : false,
    target: 'node18',
    tsconfig: 'tsconfig.json',
    define: {
      'process.env.NODE_ENV': watchMode ? '"development"' : '"production"',
    },

    plugins: [
      {
        name: 'build-notify',
        setup(build) {
          build.onEnd(() => console.log('Build completed'))
        },
      },
    ],
  }

  if (watchMode) {
    const ctx = await context(config)
    await ctx.watch()
    return
  }

  build(config)
    .catch(() => process.exit(1))
}
