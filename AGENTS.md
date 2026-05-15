# Project: admin-panel

## Do

- Use ESM import syntax (`import x from 'y'`), never require()
- Use TypeScript — all new files are .ts
- Static imports are always placed at the very top.

## Don't

- Don't install new dependencies without asking
- Don't use dynamic imports unless it is a circular dependency.

## After every file edit

- Run `npx tsc --noEmit` to typecheck
- Run `npm run lint` to see any eslint issues
- Do not move on to the next task until both pass
