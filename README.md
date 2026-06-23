<div align="center">

<img src="docs/brand/logo.png" width="420" alt="Tasqyn — AI flood early-warning"/>

# Tasqyn · тасқын

**AI flood early-warning for snowmelt-driven river basins — starting with the Ishim (Esil) river, Kazakhstan**

[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![Model](https://img.shields.io/badge/model-XGBoost-success)]()
[![API](https://img.shields.io/badge/API-FastAPI-009688)]()
[![App](https://img.shields.io/badge/app-Expo%20%2F%20React%20Native-000020)]()
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF)]()
[![Tests](https://img.shields.io/badge/tests-22%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

[English](README.md) · [Русский](README.ru.md) · [Portfolio highlights](docs/PORTFOLIO.md) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## Overview

**Tasqyn** (Kazakh: *тасқын*, “flood”) forecasts the **monthly probability of flooding**
for river basins that flood from spring snowmelt. Northern Kazakhstan suffers
recurring, costly floods every spring; Tasqyn turns 30 years of hydro-meteorological
data plus live weather into an early-warning signal that ordinary people can act on.

It is a complete, reproducible system — model, honest evaluation, live data,
calibrated probabilities, a REST API and a polished mobile app:

```
 raw + live data ─▶ feature engineering ─▶ XGBoost ─▶ calibration + uncertainty
                                                              │
   mobile app (maps, push) ◀── REST API ◀── multi-basin live forecast ◀──┘
```

## Highlights

- 🧠 **The model rediscovered the physics.** Its top predictor is **snow cover lagged
  4 months** (importance 0.53) — winter snowpack drives spring floods — with no
  hand-coded hydrology.
- 📏 **Honest metrics, not a vanity score.** Leave-one-year-out walk-forward:
  **ROC-AUC 0.91**, recall 10/14 floods at **1 false alarm in 70 months**. The naive
  1.00 split is kept only as a counter-example.
- 🎯 **Calibrated probabilities + confidence intervals.** Isotonic calibration on
  out-of-sample scores; a bootstrap ensemble gives a 90% prediction interval.
- 🌍 **Live & multi-basin.** Real look-ahead forecasts (1–3 months) for 6 basins from
  the free Open-Meteo archive — no API key.
- 📱 **Real product.** FastAPI service + Expo/React Native app with a risk map, push
  alerts and offline mode.
- 🏗️ **Engineered.** Installable package, 22 tests, ruff-clean, GitHub Actions CI,
  Docker.

## Results (honest evaluation)

| Protocol | ROC-AUC | PR-AUC | F1 | Recall | Note |
|---|---|---|---|---|---|
| Naive trailing split (12 mo) | 1.00 | 1.00 | 1.00 | — | ⚠️ Meaningless — 12 samples. Kept as a teaching example. |
| **Leave-one-year-out walk-forward** | **0.91** | **0.72** | **0.80** | **0.71** | ✅ Reported. 84 held-out months, 14 floods, 1 false alarm in 70. |

**Why month-ahead forecasting works here:** the dominant feature is December–January
snow (snow_cover lag 4), which is already *observed* before the spring flood season —
so a real forecast leans on data that already exists, with climatological normals
filling only the short remaining gap.

<div align="center">
<img src="docs/figures/timeline_probability.png" width="80%" alt="Predicted flood probability over time"/>
<img src="docs/figures/feature_importance.png" width="55%" alt="Feature importance"/>
</div>

## Quick start

```bash
git clone <your-repo-url> tasqyn && cd tasqyn
python -m venv .venv && source .venv/bin/activate
pip install -e ".[api,dev]"

floodcast-train                  # train + honest eval + calibration + plots
pytest -q                        # 22 tests
uvicorn api.main:app --reload    # http://127.0.0.1:8000/docs
```

### Live forecast (real data, no key)

```bash
curl "http://127.0.0.1:8000/forecast/live?basin_id=petropavl&horizon=3"
```

```jsonc
{
  "basin": { "name": "Petropavl", "river": "Ishim (Esil)" },
  "forecasts": [{
    "year": 2027, "month": 4,
    "flood_probability": 0.78,           // calibrated
    "confidence_interval": { "lower": 0.55, "upper": 0.93, "std": 0.1 },
    "risk": { "label": "high", "color": "#ef4444" },
    "in_flood_season": true,
    "provenance": "climatology-filled"
  }]
}
```

### Docker

```bash
docker compose up --build          # API on :8000
```

### Mobile app

```bash
cd mobile && npm install && npm start
```

A React Native (Expo) client: **risk map** of all basins, per-basin live forecast with
confidence intervals, **push alerts**, history and **offline mode**. See
[`mobile/README.md`](mobile/README.md).

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`  | `/health` | model + calibration status |
| `GET`  | `/basins` | all forecastable basins |
| `POST` | `/predict` | score a supplied observation window |
| `GET`  | `/forecast/live` | live 1–3 month forecast from Open-Meteo |
| `GET`  | `/history` | recent forecasts |
| `POST` | `/push/register` | register a device for alerts |

## Repository layout

```
tasqyn/
├── src/floodcast/        # installable ML package
│   ├── config.py · basins.py          # paths, labels, basin registry
│   ├── data_loader.py · feature_engineering.py
│   ├── model.py · evaluate.py         # training, inference, walk-forward
│   ├── calibrate.py                   # isotonic calibration + bootstrap CI
│   ├── live.py                        # Open-Meteo client + look-ahead window
│   ├── forecast.py                    # high-level forecast façade
│   ├── visualize.py · pipeline.py     # plots + CLI orchestrator
├── api/                  # FastAPI service
├── mobile/               # Expo / React Native app (maps, push, offline)
├── tests/                # 22 pytest tests
├── models/               # artifacts + calibrator + ensemble + metrics_*.json
├── docs/                 # figures, brand assets, portfolio & architecture
├── data/raw/             # real hydro-meteorological data (+ live cache)
├── legacy/               # original research scripts (provenance)
├── Dockerfile · docker-compose.yml · .github/workflows/ci.yml
└── pyproject.toml
```

## Limitations & honesty

Rather than hide these, Tasqyn surfaces them in the code and in every forecast:

- **Feature scales are matched, not faked.** Live Open-Meteo inputs are converted to the
  *same units the model trained on* (soil moisture stays volumetric 0–1; snow is depth
  in cm). A unit mismatch here would silently feed the model out-of-range values.
- **Out-of-distribution guard.** Every forecast carries a `reliability` field. If a
  basin's live inputs fall outside the training range, or it's a non-anchor (transfer)
  basin, the forecast is explicitly marked *indicative* — in the API and in the app.
- **River level is imputed for live forecasts** (Open-Meteo has no gauge); this is
  flagged (`river_level_imputed`). River features have low importance, so the impact is
  small, but it is not hidden.
- **Small positive class** (21 flood months / decade) → metrics carry variance;
  mitigated with walk-forward validation, calibration and confidence intervals.
- **Binary labels** from public reports; flood severity is not modelled.

## Provenance

Tasqyn consolidates three project iterations into one clean repo. The original
geospatial research code (`rasterio`/`netCDF4` over a region-of-interest polygon) is
preserved in [`legacy/`](legacy/). Full engineering story:
[docs/PORTFOLIO.md](docs/PORTFOLIO.md).

## License

MIT — see [LICENSE](LICENSE). Built for the people living along these rivers.
