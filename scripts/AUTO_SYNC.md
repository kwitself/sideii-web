# SIDE:II AUTO-SYNC v2

Run `scripts\sideii-auto-sync.bat` on Windows.

Behavior:
- checks `origin/main` every 15 seconds;
- if the working tree is dirty, stashes tracked + untracked non-ignored files;
- pulls/rebases `main`;
- runs `npm install` only when `package.json` or `package-lock.json` changed;
- restores the stash;
- never discards a stash when a conflict occurs.

One-shot test:

```bat
scripts\sideii-auto-sync.bat -Once
```

Custom interval:

```bat
scripts\sideii-auto-sync.bat -IntervalSeconds 30
```
