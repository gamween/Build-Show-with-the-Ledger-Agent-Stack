# Presentation video (Remotion)

A ~30s [Remotion](https://www.remotion.dev) video for the clear-signing agent:
the two scenarios (clean → approved, poisoned → rejected on the device) and the
closing line. The device screens are the real Speculos screenshots from
`../assets`, copied into `public/`.

```bash
npm install
npm run dev      # open Remotion Studio to preview/scrub
npm run render   # render to out/clearsign-agent.mp4 (1920x1080, 30fps)
```

If you change the device screenshots in the parent project (`npm run capture`),
re-copy them:

```bash
cp ../assets/02-clean-recipient.png    public/clean-recipient.png
cp ../assets/04-poisoned-recipient.png public/poisoned-recipient.png
```
