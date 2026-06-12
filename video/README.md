# Presentation video (Remotion)

A ~30s [Remotion](https://www.remotion.dev) video for the clear-signing agent,
styled as an audit "field report": the method (with the real `npm run demo`
terminal), the on-device clear-signing flow as a filmstrip, and the two
scenarios as evidence exhibits (clean → APPROVED, poisoned → REJECTED). The
device screens are the real Speculos screenshots from `../assets`, copied into
`public/`.

```bash
npm install
npm run dev      # open Remotion Studio to preview/scrub
npm run render   # render to out/clearsign-agent.mp4 (1920x1080, 30fps)
```

If you regenerate the device screenshots in the parent project
(`npm run capture`), re-copy them:

```bash
cp ../assets/06-review.png            public/review.png
cp ../assets/07-amount.png            public/amount.png
cp ../assets/02-clean-recipient.png   public/clean-to.png
cp ../assets/03-clean-sign.png        public/clean-sign.png
cp ../assets/04-poisoned-recipient.png public/poisoned-to.png
cp ../assets/05-poisoned-reject.png   public/poisoned-reject.png
```
