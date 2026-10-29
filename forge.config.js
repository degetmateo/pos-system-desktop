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
      process.env.GITHUB_TOKEN = match[1].trim();
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
    force: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'rd',
        setupIcon: './assets/logo.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
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
};
