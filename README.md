# @op-archives/vod-components

Shared VOD player components for OP-Archives streamer sites.

## Publishing

To publish to GitHub Packages, you need to:

1. Create a Personal Access Token (PAT) with `read:packages` and `publish:packages` scopes
2. Add the token as a repository secret named `NPM_TOKEN`
3. Update `.github/workflows/publish.yml` to use `${{ secrets.NPM_TOKEN }}` instead of `GITHUB_TOKEN`

The default `GITHUB_TOKEN` doesn't have permission to publish scoped packages to GitHub Packages.

## Usage

```bash
npm install @op-archives/vod-components
```

Then import components:

```jsx
import { YoutubeVod, CustomVod } from '@op-archives/vod-components';
import { Loading, NotFound } from '@op-archives/vod-components/utils';
import Games from '@op-archives/vod-components/vods/Games';
```

## Props Configuration

All site-specific assets must be passed via props (no environment variables in the package):

```jsx
<Loading logo={siteLogo} />
<NotFound channel="moonmoon" logo={siteLogo} />
<Games channel="moonmoon" />
<YoutubePlayer origin="https://moonmoon.com" />
```