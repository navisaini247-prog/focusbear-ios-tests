# Claude Code Instructions for Focus Bear Mobile App

This file contains important instructions and guidelines for Claude when working on this repository.

## Git Repository Setup

### Important: Shallow Clone Issue

**Problem:** By default, GitHub Actions (and some CI environments) perform shallow clones that fetch limited git history. This can cause issues when trying to merge branches, as git may not be able to find the common ancestor between branches, resulting in "unrelated histories" errors.

**Solution:** When you encounter merge conflicts or "unrelated histories" errors:

1. First, check if the repository is shallow:
   ```bash
   git rev-parse --is-shallow-repository
   ```

   If this returns `true`, the repository is shallow.

2. Fetch the full history:
   ```bash
   git fetch --unshallow
   ```

   This command converts the shallow clone into a full clone with complete history.

3. Verify the common ancestor exists:
   ```bash
   git merge-base HEAD origin/develop
   ```

   This should now return a commit hash instead of an error.

4. Proceed with your merge/rebase operations as normal.

### Alternative Approaches

If `git fetch --unshallow` is too slow or fails, you can try:

- Fetch with increased depth: `git fetch --depth=100` or `git fetch --depth=500`
- Use blob filtering: `git fetch --filter=blob:none` (faster as it doesn't download all file contents)

## Branch Strategy

- Main development branch: `develop` (NOT `main`)
- When comparing PR changes, use: `git diff origin/develop...HEAD`
- Always merge/rebase with `origin/develop` unless specifically instructed otherwise

## Development Guidelines

(Add additional project-specific guidelines here as they are discovered)

## Common Issues

### Merge Conflicts Due to Shallow Clone

**Symptom:** Error message like "fatal: refusing to merge unrelated histories" or merge shows excessive conflicts across the entire codebase.

**Cause:** Shallow clone doesn't have enough history to find the common ancestor.

**Fix:** Run `git fetch --unshallow` and try the merge again.

---

*This file should be updated as new patterns and issues are discovered to help future Claude instances work more effectively with this codebase.*
