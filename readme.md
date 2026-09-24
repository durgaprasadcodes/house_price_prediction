# 🏠 AP & Telangana House Price Prediction — Project Documentation

Predicts `price_inr` for a residential property in Andhra Pradesh or Telangana
from location, size and property attributes. Covers the dataset, the ML
pipeline, the FastAPI service, and Docker deployment.

> The training data (`ap_telangana_real_estate_dataset.csv`) is synthetic,
> generated to realistic price patterns, not scraped listings. Retrain on
> real data before using this for actual valuations.

---

## 1. Project structure

```
House Price Prediction/
│
├── 📁backend/
│   ├── main.py
│   ├── Dockerfile  
│   ├── model.pkl
│   └── requirements.txt                          # FastAPI service
├── frontend/
    └── React.js

```

Frontend pieces (built earlier, not part of this backend):
`CascadingLocationSelect.jsx`, `App.jsx` — state/district/locality dropdowns
that read the same `locations.json`.

---

## 2. Dataset

| | |
|---|---|
| Rows | 6,510 (3,250 Andhra Pradesh + 3,260 Telangana) |
| Districts | 61 (28 AP + 33 Telangana) |
| Localities | ~630 |
| Target | `price_inr` |

Columns: `listing_id, state, region, district, city, neighborhood,
property_type, beds, baths, size_sqft, furnishing, facing, status,
age_years, price_inr, price_per_sqft, listing_date`.

Regenerate or extend it:
```bash
python generate_ap_real_estate_dataset.py --seed 42 --out ap_telangana_real_estate_dataset.csv
# add a new batch on top of an existing file without touching its rows:
python generate_ap_real_estate_dataset.py --seed 43 --append-to ap_telangana_real_estate_dataset.csv --out ap_telangana_real_estate_dataset.csv
```

---

## 3. Feature plan

| Column | Role | Encoder |
|---|---|---|
| `price_inr` | target | `log1p` at train time, `expm1` to invert |
| `district` | feature | Target encoding |
| `district` + `neighborhood` → `locality_key` | feature | Target encoding |
| `property_type`, `furnishing`, `facing`, `status` | feature | One-hot |
| `size_sqft`, `beds`, `baths`, `age_years` | feature | numeric passthrough (tree model — no scaling needed) |
| `listing_date` → `days_since_start`, `month` | feature | numeric passthrough |
| `listing_id`, `price_per_sqft`, `state`, `region`, `city`, `neighborhood` (alone) | dropped | — |

**Why these choices:**
- `neighborhood` alone has repeated names across districts (e.g. "Balaji
  Nagar" appears in four different districts), so it's combined with
  `district` into `locality_key` before target encoding — otherwise unrelated
  places get blended into one average price.
- `property_type` / `furnishing` / `facing` / `status` have no real order
  (Villa isn't "more" than Apartment; East isn't "more" than West), so
  one-hot avoids implying a false ranking. `furnishing` looks ordinal at
  first glance, but "Not Applicable" (used for plots) breaks any scale.
- `price_per_sqft` is dropped because it's calculated directly from the
  target — including it is data leakage.
- `state`, `region`, `city` were tested against `district` + `locality_key`
  and added under ₹35k to MAE (~3.5% relative, noise-level) — dropped for a
  simpler, equally accurate pipeline.
- Target encoding (scikit-learn's `TargetEncoder`, `cv=5`) is cross-fitted to
  avoid leakage and falls back to the global mean for unseen categories, so
  an unlisted village doesn't break inference.

---

## 4. Model

`HistGradientBoostingRegressor` wrapped in a `TransformedTargetRegressor`
(log1p / expm1), inside a scikit-learn `Pipeline` + `ColumnTransformer` so
encoders are fit on training data only.

### 4.1 Train

```bash
pip install -r requirements.txt
python train_price_model.py ap_telangana_real_estate_dataset.csv
```

This writes `artifacts/price_model.joblib` (the full fitted pipeline) and
`artifacts/metrics.json`.

### 4.2 Current metrics (80/20 split, `random_state=42`)

| Metric | Value |
|---|---|
| Rows (train / test) | 5,208 / 1,302 |
| MAE | ₹9,93,935 |
| RMSE | ₹15,84,617 |
| MAPE | 15.8% |
| R² | 0.928 |

Read from `artifacts/metrics.json`, or `GET /metrics` once the API is
running. Because the training data is synthetic, this score largely reflects
how well the model recovers the pricing rules built into the generator, not
real-market accuracy — re-evaluate after retraining on real listings.

### 4.3 Retraining

Re-run `train_price_model.py` whenever the dataset changes; it overwrites
`artifacts/price_model.joblib` and `artifacts/metrics.json`. The Docker image
does not need to be rebuilt if you bind-mount `artifacts/` (see §6.2) — just
restart the container to pick up the new file.

---

## 5. FastAPI service (`app/main.py`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/metrics` | contents of `artifacts/metrics.json` |
| GET | `/locations` | full state → district → locality tree |
| GET | `/locations/{state}` | districts in one state |
| GET | `/locations/{state}/{district}` | localities in one district |
| POST | `/predict` | predict `price_inr` for one property |

### 5.1 Run locally (no Docker)

```bash
pip install -r requirements.txt
python train_price_model.py ap_telangana_real_estate_dataset.csv   # creates artifacts/
uvicorn app.main:app --reload --port 8000
```

Interactive docs: `http://localhost:8000/docs`

### 5.2 Example request

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "state": "Telangana",
    "district": "Rangareddy",
    "neighborhood": "Gachibowli",
    "property_type": "Apartment",
    "furnishing": "Semi-Furnished",
    "facing": "East",
    "status": "Ready to Move",
    "size_sqft": 1500,
    "beds": 3,
    "baths": 3,
    "age_years": 3,
    "listing_date": "2026-09-24"
  }'
```

Response:
```json
{
  "predicted_price_inr": 17629000.0,
  "predicted_price_per_sqft": 11752.36,
  "district_recognized": true,
  "locality_recognized": true
}
```

`district_recognized` / `locality_key` let the frontend show a "this is an
approximate estimate" note when a user picked "Other / not listed" in the
cascading dropdown — the target encoder still returns a prediction (using its
global fallback average) but it's less reliable for unseen places.

---

## 6. Docker deployment

### 6.1 Build

```bash
python train_price_model.py ap_telangana_real_estate_dataset.csv   # artifacts/ must exist first
docker build -t ap-tg-price-api:latest .
```

### 6.2 Run

```bash
docker run -d --name ap-tg-price-api \
  -p 8000:8000 \
  -v "$(pwd)/artifacts:/srv/artifacts:ro" \
  ap-tg-price-api:latest
```

Or with Compose (same result, plus a healthcheck):
```bash
docker compose up -d --build
docker compose logs -f price-api
docker compose down
```

The `artifacts/` volume mount means retraining and restarting the container
(`docker compose restart price-api`) picks up a new model without rebuilding
the image.

### 6.3 Verify

```bash
curl http://localhost:8000/health
# {"status":"ok","model_loaded":true}
```

---

## 7. End-to-end workflow

```
1. generate_ap_real_estate_dataset.py  →  ap_telangana_real_estate_dataset.csv
2. train_price_model.py                →  artifacts/price_model.joblib, artifacts/metrics.json
3. docker build / docker compose up    →  API container serving /predict
4. Frontend (CascadingLocationSelect)  →  collects state/district/neighborhood + property details
5. POST /predict                       →  predicted_price_inr returned to the frontend
```

## 8. Known limitations

- Training data is synthetic — retrain on real listings before using this
  for real valuations.
- `locations.json` covers towns/mandals/city localities, not individual
  villages; users outside the list fall back to "Other / not listed" and a
  district-level average.
- CORS in `app/main.py` is wide open (`allow_origins=["*"]`) for development
  — restrict it to your actual frontend origin before deploying publicly.
- No authentication on the API — add an API key or JWT check in `app/main.py`
  before exposing it beyond a trusted network.