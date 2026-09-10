# Codex Working Rules

## Priorities

- Prioritize implementation speed and token efficiency.
- Keep changes small and focused on the requested scope.
- Do not perform broad codebase exploration, unrelated refactoring, or exhaustive regression checks unless the task requires them.

## Verification Policy

- Do not run automated browser or UI verification by default.
- Leave UI appearance, gameplay feel, animation quality, and control feel for the user to verify manually.
- For ordinary TypeScript or TSX changes, use `npm run lint` as the default verification.
- CSS, copy, documentation, and straightforward image or asset changes may skip verification when additional checks would not provide useful confidence.
- For game logic changes, run the directly related tests first.
- Run the full `npm test` suite only when changing shared or core logic, or when the change can affect multiple systems.
- Run `npm run build` only for build configuration, dependencies, deployment behavior, module or asset resolution, or when the user explicitly requests it.
- Do not add broad regression testing beyond the affected scope unless there is a concrete risk that justifies it.
- An explicit verification instruction from the user takes precedence over these defaults.

## Completion Report

Keep the completion report concise and include only:

- what changed;
- verification actually performed;
- what the user should check manually.

