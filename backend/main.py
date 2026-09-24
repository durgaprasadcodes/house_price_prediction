from fastapi import FastAPI
from pydantic import BaseModel  
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd


class Data(BaseModel):
    state: str
    district: str
    locality_key: str
    property_type: str
    beds: int
    baths: int
    size_sqft: int
    furnishing: str
    facing: str
    age_years: int


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=["https://ap-ts-house-price-prediction.vercel.app/"]
)

model = joblib.load("model.pkl")


@app.get("/")
async def home():   
    return {
        "message" : "House Price Prediction API is Successfully Running"
    }

@app.post("/predict")
async def prediction(data: Data):

    new_record = pd.DataFrame([{
        "district": data.district,
        "locality_key": data.locality_key,
        "beds": data.beds,
        "baths": data.baths,
        "log_size_sqft": np.log1p(data.size_sqft),
        "log_age_years": np.log1p(data.age_years),
        "state": data.state,
        "property_type": data.property_type,
        "furnishing": data.furnishing,
        "facing": data.facing,
    }])

    predicted_log_price = model.predict(new_record)[0]

    predicted_price = float(np.expm1(predicted_log_price))
    predicted_price_per_sqft = round(predicted_price / data.size_sqft, 2) if data.size_sqft > 0 else 0.0
    locality_recognized = False if "Other / not listed" in data.locality_key else True
    district_recognized = True

    return {
        "predicted_price_inr": round(predicted_price, 2),
        "predicted_price_per_sqft": predicted_price_per_sqft,
        "district_recognized": district_recognized,
        "locality_recognized": locality_recognized,
        "prediction": f"Predicted price: ₹{predicted_price:,.0f}"
    }