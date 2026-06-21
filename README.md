# Tasqyn — showcase site

A self-contained static landing/showcase site for the Tasqyn flood-forecasting
project. No build step, no server, no GitHub required.

## View it

Just open the file in any browser:

```bash
xdg-open index.html        # Linux
# or double-click index.html
```

(An internet connection only matters for the web fonts; everything else —
figures, app mockups — is local.)

## What's inside

- **Hero** with an animated risk-gauge instrument
- **Honest proof**: the real walk-forward metrics (ROC-AUC 0.91, recall 10/14,
  1 false alarm in 70) contrasted with the discarded naive 1.00 split, plus the
  actual model figures from `docs/figures/`
- **The signal**: the rediscovered snowmelt physics (`snow_cover_lag4` = 0.53)
- **App showcase**: faithful device mockups of the Map, Forecast and History
  screens (same design tokens and numbers as the real Expo app)
- **Honest-by-design** and **engineering** sections

## Design

Built following the **frontend-design** plugin methodology: a committed
hydrographic / scientific-editorial direction — deep-water dark palette,
topographic contour motif, grain overlay, and a distinctive type pairing
(Fraunces display · Archivo body · Space Mono data) that deliberately avoids
generic AI aesthetics.

```
site/
├── index.html     # all content
├── styles.css     # design system
├── app.js         # scroll reveals + gauge animation
└── assets/        # logo, icon, model figures
```
