# Auth video loop

Drop a video file (`.mp4`, `.webm`, or `.mov`) in this folder and it will
automatically show up looping on the login, signup, and forgot-password
pages — no code changes needed. It plays in the left panel on desktop, and
full-bleed behind the form on mobile.

- Pick whichever file sorts first alphabetically if you add more than one
  (e.g. `01-auth-loop.mp4`).
- Keep it short (5-15s), silent, and reasonably compressed — it's muted
  and autoplays on every device including mobile data connections, so
  file size directly affects how fast these pages load and how much data
  they use. Aim well under 5MB if you can.
- If no video is present, desktop falls back to a plain brand-green
  gradient and mobile falls back to the still photo, so the pages never
  break with this folder empty.
