# @op-archives/vod-components

Shared VOD player components for OP-Archives sites.

## Usage

```bash
npm install @op-archives/vod-components
```

Then import components:

```jsx
import { YoutubeVod, CustomVod, Games } from '@op-archives/vod-components';
```

## Props Configuration

All site-specific assets must be passed via props:

```jsx
<Games channel="" archiveApiBase="" />
<YoutubeVod channel="" archiveApiBase="" />
```
