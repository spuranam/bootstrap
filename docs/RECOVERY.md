# Recovery

Bootstrap is not transactional. If a phase fails, stop, note the failed phase and error, and inspect the current state
before retrying. Do not delete the mise directories, global config, credentials or SSH keys as a general reset.

## Inspect the current state

Run these read-only checks from the active config directory:

```sh
cd "$HOME/.config/mise"
mise bootstrap status
mise dot status
mise dot diff
```

If the active config is a Git checkout, also inspect `git status --short` and the relevant commit diff. If it is an
rsync-managed copy, inspect the source checkout and the files listed by the rsync dry run. See
[Maintenance and updates](MAINTENANCE.md) for the two update paths.

## Recover by failure type

- **Config update:** Restore a known-good reviewed commit with Git, or re-copy a known-good reviewed seed with rsync.
  Preview file changes before copying; rsync does not restore overwritten destination files unless you have a backup.
- **Dotfile conflict:** Back up the affected user file, review `mise dot diff`, and apply only the specific reviewed
  edit. Use `mise dot undo` only when a suitable mise-tracked checkpoint exists. Do not use `--force-dotfiles` as a
  general fix.
- **Missing shell PATH:** Temporarily expose the approved mise binary, then preview the shell activation repair:

  ```sh
  export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
  MISE_LOCKED=1 mise bootstrap --only dotfiles,mise-shell-activate --dry-run
  ```

  If the preview is understood, apply that same targeted command without `--dry-run`, then open a new login shell.
- **Symlinked `~/.zshrc` migration:** Move the managed regular `~/.zshrc` aside, then restore
  `~/.zshrc.pre-mise-symlink` to `~/.zshrc`. The original symlink target remains unchanged. Keep `~/.zshrc.local` until
  its contents and later edits have been reviewed.
- **Credential issue or device loss:** Follow the provider-side revocation steps in
  [Credential and secret lifecycle](CREDENTIALS.md). Deleting local files alone does not revoke remote access.
- **Capability removal:** Edit the ignored `miserc.local.toml`, inspect `mise bootstrap unapply` help and preview before
  removing anything. Removing a capability does not necessarily uninstall its packages.

Never run mise as root or use broad cleanup commands to recover from a failed bootstrap.
