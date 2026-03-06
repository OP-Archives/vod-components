# @op-archives/vod-components

Shared VOD player components for OP-Archives streamer sites.

## Publishing

**Important:** To publish a scoped package (`@op-archives/vod-components`), you must:

1. **Accept the package scope**: The org owner needs to invite you to publish under `@op-archives`
   - Go to https://github.com/orgs/OP-Archives/packages?package_type=npm&visibility=public
   - Or check your email for an invitation from GitHub

2. **Create a Personal Access Token (PAT)** with `read:packages` and `publish:packages` scopes

3. **Add the token as a repository secret**:
   - Go to Settings → Secrets and variables → Actions
   - Add new secret named `NPM_TOKEN` with your PAT value

4. **Configure the workflow** (already done in `.github/workflows/publish.yml`)

The default `GITHUB_TOKEN` cannot publish scoped packages unless you've been explicitly invited to the scope.

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