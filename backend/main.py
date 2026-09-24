from fastapi import FastAPI
from pydantic import BaseModel
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

model = joblib.load("model.pkl")


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

    # Model predicts log(price)
    predicted_log_price = model.predict(new_record)[0]

    # Convert log(price) back to original price
    predicted_price = np.expm1(predicted_log_price)

    return {
        "prediction": f"Predicted price: ₹{predicted_price:,.0f}"
    }