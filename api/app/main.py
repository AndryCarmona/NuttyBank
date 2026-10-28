from fastapi import FastAPI

app = FastAPI(title="NuttyBank API")


@app.get("/health")
def health():
    return {"status": "ok"}