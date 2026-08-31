# About page media

Drop photos and/or videos in this folder and they'll automatically show up
in the slideshow on the About page — no code changes needed.

- **Caption comes from the filename.** `Food-drives-reaching-families.jpg`
  becomes the caption "Food drives reaching families" (hyphens/underscores
  become spaces, the extension is dropped, everything else — including
  capitalization — is shown exactly as typed). Name the file exactly what
  you want the caption to say.
- **Order comes from the filename too**, sorted alphabetically — prefix
  with numbers if you want a specific order, e.g. `01-food-drive.jpg`,
  `02-school-supplies.jpg`.
- **Photos** auto-advance to the next item after 4 seconds, like a slow
  slideshow.
- **Videos** play in full (with sound off) and then advance to the next
  item on their own — they're not cut off early.
- **Hovering pauses** whichever is currently showing (a photo's countdown
  stops, a video pauses) until the pointer moves away.
- Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` for photos; `.mp4`,
  `.webm`, `.mov` for videos.
- If this folder is empty, the About page falls back to its original
  built-in placeholder photos, so the page never breaks.
