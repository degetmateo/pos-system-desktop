const fs = require('node:fs');
const path = require('node:path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

if (!process.env.GITHUB_TOKEN) {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^GITHUB_TOKEN=(.+)$/m);
    if (match) {
      process.env.GITHUB_TOKEN = match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
}

module.exports = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'degetmateo',
          name: 'pos-system-desktop',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  packagerConfig: {
    asar: true,
    icon: './assets/logo.ico',
    ignore: [
      /^\/src($|\/)/,
      /^\/tests($|\/)/,
      /^\/\.git($|\/)/,
      /^\/\.env($|\/)/,
      /^\/tsconfig.*\.json$/,
      /^\/vite.*\.mts$/,
      /^\/vitest.*\.mts$/,
    ],
  },
  rebuildConfig: {
    onlyModules: ['better-sqlite3'],
    force: false,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'rd',
        setupIcon: './assets/logo.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    packageAfterCopy: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      if (platform === 'win32' && arch === 'x64') {
        const winBinary = path.resolve(__dirname, 'assets', 'native', 'win32-x64', 'better_sqlite3.node');
        if (fs.existsSync(winBinary)) {
          const target = path.join(buildPath, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(winBinary, target);
        }
      }
    },
    postPackage: async (forgeConfig, options) => {
      if (options.platform === 'win32' && options.arch === 'x64') {
        const winBinary = path.resolve(__dirname, 'assets', 'native', 'win32-x64', 'better_sqlite3.node');
        if (fs.existsSync(winBinary) && Array.isArray(options.outputPaths)) {
          for (const outPath of options.outputPaths) {
            const unpackedTarget = path.join(outPath, 'resources', 'app.asar.unpacked', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
            if (fs.existsSync(path.dirname(unpackedTarget))) {
              fs.mkdirSync(path.dirname(unpackedTarget), { recursive: true });
              fs.copyFileSync(winBinary, unpackedTarget);
            }
          }
        }
      }
    },
  },
};
