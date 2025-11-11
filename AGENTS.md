# AGENTS.md — How to Contribute Code with an AI Assistant (TypeScript, Clean Code–aligned)

**Audience:** AI coding assistants (e.g., Codex, Copilot Chat, ChatGPT, etc.) and humans collaborating with them.
**Scope:** How to propose, write, and revise code in this repository following Clean Code principles adapted to modern TypeScript.
**Goal:** Produce small, readable, well‑tested changes that integrate cleanly with the existing codebase. Favor clarity over cleverness. Fewer moving parts, better names, tighter feedback loops.

---

## 0) Operating Mode for AI Assistants

When asked to make changes, follow this interaction pattern unless the user explicitly asks for something else:

1. **Preflight**

   * Infer project constraints from the repo: `tsconfig.json`, `package.json`, lockfile, linter configs, test framework.
   * If you must assume, state assumptions explicitly in your proposal.

2. **Plan (brief)**

   * Summarize: problem → approach → files to touch → tests to add/update → risks.
   * Keep it ≤10 bullet points.

3. **Patch**

   * Provide changes as one or more *atomic* patches per feature/fix.
   * Use fenced `diff` blocks per file with correct paths:

     ```diff
     diff --git a/src/foo.ts b/src/foo.ts
     index abc..def 100644
     --- a/src/foo.ts
     +++ b/src/foo.ts
     @@
     -old
     +new
     ```
   * If adding dependencies, include a separate `diff` for `package.json` and `pnpm-lock.yaml`/`yarn.lock`/`package-lock.json` only if already present.

4. **Rationale + Verification**

   * Explain how the patch satisfies acceptance criteria.
   * Show how to run: typecheck, linter, tests, and any build step.
   * Note performance/security implications, migration steps (if any).

5. **Follow‑ups**

   * If ambiguity remains, list 1–3 concise questions *with a default* you will use if no answer is provided.

---

## 1) Clean Code Principles (TypeScript–Focused)

### 1.1 Meaningful Names

* **Prefer intention‑revealing names** over comments.
  Bad:

  ```ts
  const n = users.filter(u => !u.a);
  ```

  Good:

  ```ts
  const activeUsers = users.filter(user => !user.archived);
  ```
* **Avoid encodings** (`IUser`, `user_list`, Hungarian notation).
* **Booleans read as predicates**: `isReady`, `hasPaid`, `shouldRetry`.
* **Avoid magic numbers/strings**: elevate to `const` or typed enums/literals.

### 1.2 Small, Focused Functions

* One responsibility per function; ≤~15 lines where practical.
* **One level of abstraction per function.**
* Prefer **early returns** to reduce nesting:

  ```ts
  function canShip(order: Order): boolean {
    if (order.status !== "paid") return false;
    if (order.items.length === 0) return false;
    return order.address !== undefined;
  }
  ```

### 1.3 Expressive Types Over Comments

* Use **union types**, **discriminated unions**, **branded types**, and **type guards** to encode invariants.
* Prefer **`unknown`** over `any`. Avoid `as` casts unless you’re narrowing after validation.
* Model “absence” with `undefined` or explicit `Option`-like types; avoid sentinel magic values.

### 1.4 Errors & Exceptions

* Use **typed errors** or a `Result<T, E>` pattern consistently across the codebase. Do not mix styles in the same module.
* **Don’t swallow errors**. Either handle them or rethrow with context:

  ```ts
  try {
    await payment.charge(invoice);
  } catch (e) {
    throw new PaymentError("Charge failed", { cause: e, invoiceId: invoice.id });
  }
  ```
* For control flow, prefer **exhaustive checks**:

  ```ts
  type State = { kind: "idle" } | { kind: "running" } | { kind: "failed"; error: Error };

  function assertNever(x: never): never { throw new Error(`Unexpected: ${x as never}`); }

  function render(s: State) {
    switch (s.kind) {
      case "idle": return "Idle";
      case "running": return "Running";
      case "failed": return `Failed: ${s.error.message}`;
      default: return assertNever(s); // compile-time exhaustiveness
    }
  }
  ```

### 1.5 Side Effects & State

* Prefer **pure functions**. Isolate side effects (I/O, time, randomness) at the edges.
* **Immutability by default**: `readonly` arrays/tuples, `as const` where helpful.
* If mutating is necessary (performance, APIs), **limit scope** and document invariants.

### 1.6 Comments & Docs

* Comments explain **why**, not **what** (code should reveal *what*).
* Use **JSDoc** only for public APIs, tricky algorithms, domain knowledge, or gotchas.

  ```ts
  /**
   * Calculates pro‑rated refund using 30/360 day count convention.
   * Invariant: start <= end, amount >= 0.
   */
  ```

### 1.7 Formatting & Linting

* Follow the repository’s Prettier/ESLint settings. If missing, default to:

  * Prettier defaults.
  * ESLint with `@typescript-eslint/recommended`, `noUnusedLocals`, `noUnusedParameters`.
* **Never introduce stylistic drift** within a file.

### 1.8 Dependencies

* Add a dependency only if:

  1. It materially reduces complexity or risk;
  2. It is actively maintained;
  3. It doesn’t bloat the bundle/server unnecessarily.
* Prefer stdlib/Node APIs and small utilities over large frameworks for simple tasks.

### 1.9 SOLID, Applied Practically

* **Single Responsibility:** each module reasons about one thing.
* **Open/Closed:** add new behavior via composition or new types, not editing switch statements all over.
* **Liskov:** respect substitutability in public interfaces.
* **Interface Segregation:** small, focused interfaces.
* **Dependency Inversion:** depend on abstractions (ports) at boundaries.

---

## 2) TypeScript Conventions

### 2.1 tsconfig Baseline (assume unless repo says otherwise)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true,
    "resolveJsonModule": true
  }
}
```

### 2.2 Types vs Interfaces

* Use **`type`** for unions/intersections/function types and mapped/utility types.
* Use **`interface`** for public object shapes expected to be extended/implemented.

### 2.3 Narrowing & Guards

```ts
function isNonEmpty<T>(arr: readonly T[]): arr is readonly [T, ...T[]] {
  return arr.length > 0;
}

type ApiResponse =
  | { status: "ok"; data: User }
  | { status: "error"; message: string };

function handle(r: ApiResponse) {
  if (r.status === "ok") return r.data;
  return new Error(r.message);
}
```

### 2.4 Generics with Constraints

```ts
function byKey<T extends Record<string, unknown>, K extends keyof T>(items: T[], key: K): Record<string, T[K]> {
  return Object.fromEntries(items.map(i => [String(i[key]), i[key]]));
}
```

### 2.5 Async & Promises

* **Never ignore a Promise**. If intentionally fire‑and‑forget, capture with `void` and comment.
* **Aggregate waits**:

  ```ts
  const results = await Promise.allSettled(tasks);
  ```
* Support cancellation with **`AbortController`** where relevant.

---

## 3) Project Structure & Boundaries

> Prefer a modest “ports & adapters” (hexagonal) layout. Keep domain logic framework‑agnostic.

```
/src
  /domain        // pure types and business logic
  /app           // use cases / services orchestrating domain + ports
  /ports         // interfaces for IO (e.g., MessageBus, Clock, FileStore)
  /infra         // implementations of ports (db, http, fs, cloud SDKs)
  /ui            // optional (e.g., React components, CLI, HTTP handlers)
  /test          // test helpers, fixtures
```

**Rules**

* `domain` has **no** imports from `infra`/`ui`.
* `app` depends on `domain` and `ports`; wires implementations at composition root.
* `infra` may import `ports` and `domain` types but not vice versa.

---

## 4) Error Handling Pattern (choose one, stay consistent)

### Option A: Exceptions with typed subclasses

* Extend `Error` with `name`, `code`, and `cause`.
* Only throw domain/infra errors; never throw raw strings.

### Option B: Result type

```ts
type Ok<T> = { ok: true; value: T };
type Err<E extends Error = Error> = { ok: false; error: E };
type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = <E extends Error>(error: E): Err<E> => ({ ok: false, error });

function parseUser(json: string): Result<User, SyntaxError> {
  try { return ok(JSON.parse(json) as User); }
  catch (e) { return err(new SyntaxError("Invalid JSON", { cause: e })); }
}
```

> **Agent directive:** detect which style the file/module uses and conform to it.

---

## 5) Testing

### 5.1 Approach

* **Test behavior, not implementation.**
* Prefer **table‑driven tests** and **property‑based tests** (when helpful).
* Unit tests for domain; integration tests for infra and adapters; a few end‑to‑end happy paths.

### 5.2 Conventions

* Framework: follow repo (Vitest/Jest).
* Name files `*.test.ts`.
* One logical behavior per test; name clearly.

```ts
describe("prorateRefund", () => {
  it("returns 0 for zero days elapsed", () => { /* ... */ });
  it("caps at full amount", () => { /* ... */ });
});
```

### 5.3 Fakes over Mocks

* Prefer **fakes/stubs**. Use mocks sparingly and only at boundaries.

### 5.4 Snapshot tests

* Use snapshots only for stable, presentation‑heavy outputs. Avoid for logic.

---

## 6) Logging, Observability, & Performance

* Log **events** with actionable context, not internals of every function.
* Don’t log secrets (tokens, passwords, PII).
* Measure before optimizing. If a hot path is optimized, **explain why** and **benchmark** approach.

---

## 7) Security & Configuration

* **Never** hardcode secrets. Use environment variables and a configuration module that validates required keys at startup.
* Input validation: prefer narrow types and type guards; adopt a schema validator **only if** already present in the repo (e.g., `zod`, `valibot`, `yup`)—don’t introduce one lightly.
* Sanitize all external inputs, especially when composing shell/SQL/HTML.
* Use `node:crypto` and Web Crypto APIs; avoid custom crypto.

---

## 8) Module Patterns & Examples

### 8.1 Pure domain function (good)

```ts
// src/domain/pricing.ts
export type Money = number & { readonly brand: unique symbol }; // branded nominal type
export const money = (n: number) => n as Money;

export function prorateRefund(total: Money, daysUsed: number, daysInCycle: number): Money {
  if (daysInCycle <= 0) throw new RangeError("daysInCycle must be > 0");
  const ratio = Math.max(0, Math.min(1, (daysInCycle - daysUsed) / daysInCycle));
  return money(total * ratio);
}
```

### 8.2 Port + Adapter

```ts
// src/ports/Clock.ts
export interface Clock {
  now(): Date;
}

// src/infra/SystemClock.ts
import { Clock } from "../ports/Clock";
export class SystemClock implements Clock {
  now() { return new Date(); }
}
```

### 8.3 HTTP handler with validation + abort

```ts
// src/ui/http/createUser.ts
import type { Request, Response } from "express";
import { createUser } from "../../app/createUser";

export async function createUserHandler(req: Request, res: Response) {
  const { email } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const abort = new AbortController();
  req.on("close", () => abort.abort());

  try {
    const user = await createUser({ email }, { signal: abort.signal });
    return res.status(201).json(user);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
```

---

## 9) File, Folder, and Naming Rules

* Filenames kebab‑case: `user-service.ts`, `create-user.test.ts`.
* A file should export **one primary thing** (type, class, or function).
* **No barrel files** (`index.ts`) unless there is a strong module‑boundary reason.
* Keep public API small; mark internals `/** @internal */` when using a single package build.

---

## 10) Definition of Done (DoD) — Checklist for Agents

Before proposing a patch, confirm all items:

* [ ] Clear **problem statement** and **acceptance criteria** restated in your Plan.
* [ ] **Small PR** (ideally < 300 lines changed excluding snapshots and lockfiles).
* [ ] Code follows **Clean Code** rules in this doc (names, small functions, no magic values).
* [ ] Types are **strict**; no `any` unless justified with comment.
* [ ] **No unused** exports/parameters/variables.
* [ ] Error handling follows the module’s chosen **style** (Exceptions or Result).
* [ ] **Tests added/updated** and pass locally. Include table cases for edge conditions.
* [ ] **Typecheck** (`tsc --noEmit`) and **lint** pass with repo config.
* [ ] No secrets or credentials added; config validated.
* [ ] If dependencies added/removed, rationale provided and versions pinned.
* [ ] Documentation updated (JSDoc or README) if public behavior changed.
* [ ] Migration notes provided when data/schema/contract changes.

---

## 11) Commit & PR Hygiene

### 11.1 Conventional Commits

Use:

* `feat: add pro‑rated refunds`
* `fix: handle empty cart in checkout`
* `refactor(domain): split pricing from discounts`
* `test: add property tests for date parser`
* `chore(deps): bump @types/node to ^20.11.0`

### 11.2 PR Description Template

**What**

* Short summary of the change.

**Why**

* Problem and measurable outcome.

**How**

* High‑level approach, tradeoffs, alternatives considered.

**Notes for Reviewers**

* Risk areas, follow‑ups, screenshots/logs if relevant.

**Verification**

* Commands to run, sample inputs/outputs.

---

## 12) Minimal Patch Examples

### 12.1 Replace a magic number with named constant

```diff
diff --git a/src/app/billing.ts b/src/app/billing.ts
--- a/src/app/billing.ts
+++ b/src/app/billing.ts
@@
-const lateFee = amount * 0.07;
+/** Late fee is a fixed 7% per policy v3. */
+const LATE_FEE_RATE = 0.07 as const;
+const lateFee = amount * LATE_FEE_RATE;
```

### 12.2 Add exhaustive check on discriminated union

```diff
diff --git a/src/domain/state.ts b/src/domain/state.ts
--- a/src/domain/state.ts
+++ b/src/domain/state.ts
@@
 type State = { kind: "idle" } | { kind: "running" } | { kind: "failed"; error: Error };
+function assertNever(x: never): never { throw new Error(`Unexpected: ${String(x)}`); }
 function label(s: State): string {
   switch (s.kind) {
     case "idle": return "Idle";
     case "running": return "Running";
     case "failed": return `Failed: ${s.error.message}`;
+    default: return assertNever(s);
   }
 }
```

---

## 13) When In Doubt

* Prefer **clarity** over compactness.
* Prefer **composition** over inheritance.
* Prefer **data + functions** over classes unless an object truly represents a cohesive entity with behavior and invariants.
* Prefer **domain words** from business language.
* Prefer **removing code** over adding configuration.

---

## 14) Repository Assumptions (Agents should detect)

* **Package manager:** infer from lockfile (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`).
* **Module system:** follow `type` in `package.json` (`"module"` vs `"commonjs"`).
* **Test runner:** infer from `devDependencies` (`vitest`, `jest`, etc.).
* **CI scripts:** use existing `npm scripts` (do not invent). If missing, propose minimal scripts:

  ```json
  {
    "scripts": {
      "build": "tsc -p tsconfig.json",
      "typecheck": "tsc --noEmit",
      "lint": "eslint . --ext .ts,.tsx",
      "test": "vitest run"
    }
  }
  ```

---

## 15) Non‑Goals & Anti‑Patterns

* ❌ Over‑abstracting early; YAGNI applies.
* ❌ Large PRs mixing refactors and features.
* ❌ Introducing frameworks for trivial tasks.
* ❌ Using `any` to silence errors.
* ❌ Comments that explain obvious code instead of improving the code.
* ❌ Re‑export storms (`index.ts` barrels) that hide module ownership.

---

## Appendix A — Quick JSDoc Patterns

```ts
/** Domain currency, minor units (cents). */
export type Cents = number & { readonly brand: unique symbol };

/** Returns a positive integer; throws RangeError otherwise. */
export function asPositiveInt(n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError("Expected positive integer");
  return n;
}
```

---

## Appendix B — Lightweight Result Helpers (drop‑in)

```ts
export type Ok<T> = { ok: true; value: T };
export type Err<E extends Error = Error> = { ok: false; error: E };
export type Result<T, E extends Error = Error> = Ok<T> | Err<E>;
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E extends Error>(error: E): Err<E> => ({ ok: false, error });
```

---

## Appendix C — Review Ready Checklist (agent‑friendly)

Paste this above your patch:

```
### Plan
- …

### Assumptions
- …

### Commands
- pnpm install / npm i
- pnpm typecheck / npm run typecheck
- pnpm test / npm test

### Risks
- …

### Future Work (optional)
- …
```

---

**Attribution Note:** This document is inspired by principles from *Clean Code* by Robert C. Martin, adapted for TypeScript and for collaboration with AI coding assistants. It summarizes and applies general guidelines; it does not reproduce proprietary text.

---

**End of AGENTS.md**
