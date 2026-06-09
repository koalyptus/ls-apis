# ROADMAP.md

## 1. Migrate to `moduleResolution: "nodenext"`

### Context

Node.js ESM requires explicit `.js` extensions on all relative imports (`from './foo.js'`). This is a runtime requirement — no way around it.

The project originally used `moduleResolution: "bundler"`, which lets TypeScript accept extensionless imports (`from './foo'`). This looks cleaner but hides the Node.js requirement. TypeScript won't complain, but Node.js will at runtime when it loads the compiled `.js` output.

This mismatch caused the shared package bug: it exported raw `.ts` source via the `exports` map, Node.js loaded those `.ts` files directly, and the extensionless imports inside them failed with `ERR_MODULE_NOT_FOUND`.

The immediate fix was to build shared to `dist/` so Node.js loads compiled `.js` files. The migration below makes the codebase honest about the `.js` requirement — TypeScript enforces extensions at compile time, so regressions are caught during `tsc`, not in production.

### tsconfig changes (4 files)

In each package's `tsconfig.json`:

```diff
-  "module": "ESNext",
-  "moduleResolution": "bundler",
+  "module": "NodeNext",
+  "moduleResolution": "nodenext",
```

Files: `packages/{aggregator,cli,shared,mcp-server}/tsconfig.json`

### Add `.js` extensions to imports (47 files, 84 imports)

Even though the source files are `.ts`, imports must use `.js` extensions. TypeScript resolves `./foo.js` to `./foo.ts` during compilation; at runtime Node.js finds `./foo.js` (the compiled output).

```diff
- import { search } from './search';
+ import { search } from './search.js';
```

```diff
- export * from './types';
+ export * from './types.js';
```

**Scope by package**:

| Package                               | Files | Imports |
| ------------------------------------- | ----- | ------- |
| aggregator                            | 21    | 37      |
| cli                                   | 8     | 19      |
| shared (tests only, src already done) | 4     | 5       |
| mcp-server                            | 14    | 23      |

### Remove `tsc-esm-fix` (2 packages)

With `nodenext`, `tsc` outputs correct `.js` extensions natively. `tsc-esm-fix` is no longer needed.

**cli** (`packages/cli/package.json`):

- Build script: `"tsc && tsc-esm-fix --target dist"` → `"tsc"`
- Remove `tsc-esm-fix` from `devDependencies`

**mcp-server** (`packages/mcp-server/package.json`):

- Build script: `"tsc && tsc-esm-fix --target dist"` → `"tsc"`
- Remove `tsc-esm-fix` from `devDependencies`

### Update AGENTS.md

- Note that `moduleResolution: "nodenext"` is used
- Remove references to `tsc-esm-fix` being required
- Document the `.js` extension convention

### Verification

1. `npm run typecheck` — all 4 packages pass
2. `npm test` — all tests pass (vitest handles `.js` extensions)
3. `npm run build` — shared builds, cli builds, both produce runnable output
4. `npm link --workspace=@ls-apis/cli && ls-apis -q test` — global command works
5. `npm run mcp` — MCP server starts correctly
