# Auth video loop

Drop a video file (`.mp4`, `.webm`, or `.mov`) in this folder and it will
automatically show up looping in the left panel of the login, signup, and
forgot-password pages — no code changes needed.

- Pick whichever file sorts first alphabetically if you add more than one
  (e.g. `01-auth-loop.mp4`).
- Keep it short (5-15s), silent, and reasonably compressed — it's muted
  and autoplays, so file size directly affects how fast these pages load.
- If no video is present, the panel falls back to a plain brand-green
  gradient, so the pages never break with this folder empty.
