from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from schema.user_input import UserInput
from model.predict import predict_output,model,MODEL_VERSION
from schema.response import PredictionResponse


app=FastAPI()
BASE_DIR = Path(__file__).resolve().parent
app.mount("/assets", StaticFiles(directory=BASE_DIR / "frontend"), name="assets")



#human readble
@app.get('/')
def home():
    return FileResponse(BASE_DIR / "frontend" / "index.html")
@app.get('/health')
#machine readable
def health_check():
    return {
        'status':'OK',
        'version':MODEL_VERSION
    }
@app.post('/predict',response_model=PredictionResponse)
def predict_premium(data:UserInput):
    user_input = {
        'bmi': data.bmi,
        'age_group': data.age_group,
        'lifestyle_risk': data.lifestyle_risk,  
        'city_tier': data.city_tier,            
        'income_lpa': data.income_lpa,
        'occupation': data.occupation
    }
    try:
        prediction = predict_output(user_input)
        return JSONResponse(status_code=200, content={'response': prediction})
    except Exception as e:
        return JSONResponse(status_code=500,content=str(e))

