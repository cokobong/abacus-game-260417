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

## Git Safety Rules

1. Before starting work, always inspect the current Git state:
   - Run `git status`.
   - Run `git branch --show-current`.
   - Run `git fetch origin`.
   - Check whether the current branch is ahead of, behind, or diverged from the matching `origin` branch.
2. Even when the user asks to upload to Git, commit, or push, do not begin by immediately running `git pull` or `git push`.
3. When uncommitted changes exist, do not run commands that substantially alter the working tree, including `git pull`, `git rebase`, `git reset`, `git checkout`, or `git switch`, without explicit user direction.
4. If the remote branch is ahead of the local branch, or the branches have diverged, do not automatically merge, rebase, or force-push. Report the current state to the user first.
5. Force-push is prohibited:
   - Do not run `git push --force` or `git push -f`.
   - Even if explicitly requested, explain the risk first and do not execute it without a separate confirmation.
6. The default completion flow is:
   - Finish the requested work.
   - Run only the necessary minimum verification.
   - Check `git status`.
   - Run `git add`.
   - Run `git commit`.
   - Stop at the commit unless push was explicitly requested.
7. Push only when all of the following safety conditions are satisfied:
   - The current working branch is correct.
   - `origin` has been fetched.
   - The remote points to the expected repository.
   - The branch is not diverged.
   - There is no known conflict risk.
   - The working tree state has been inspected.
8. When work may have occurred on multiple PCs or remote environments, prefer committing only and ask for user confirmation before pushing.
9. Push only when the user explicitly asks to push or upload to GitHub, and only after completing the safety checks above.
10. After a push, verify synchronization by running:
    - `git fetch origin`
    - `git status`
    - `git log --oneline --decorate -5`
    - Confirm the current `HEAD` branch, the matching `origin` branch, and the latest commit SHA.
    - Confirm that local `HEAD` and remote `origin` HEAD are identical.
11. For Netlify-connected projects, treat GitHub push and Netlify deployment as separate steps:
    - Confirm that the pushed branch is the deployment branch.
    - Let Netlify deploy automatically from the GitHub push.
    - Do not change Netlify settings without explicit user direction.
12. Do not delete, merge, or clean up backup branches that are unrelated to the current task.
13. In completion reports, keep Git information limited to:
    - Current branch.
    - Created commit SHA.
    - Whether a push was performed.
    - Whether local and remote are synchronized.
    - Any conflicts or cautions.

Additional principles:

- Do not perform Git operations automatically when the user only requests code changes.
- Interpret “save up to here” as a request to commit, not push.
- Push only when the user clearly asks to push or upload to GitHub.
- If remote state is unclear, fetch and inspect the state before proceeding.
- Never automatically run Git commands that could cause data loss.
