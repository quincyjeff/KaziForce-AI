from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")


class Document(BaseModel):
    id: int
    text: str


class MatchRequest(BaseModel):
    query_text: str
    documents: list[Document]
    top_n: int = 10


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match")
def match(request: MatchRequest):
    if not request.documents:
        return {"matches": []}

    query_embedding = model.encode(request.query_text, normalize_embeddings=True)
    document_embeddings = model.encode(
        [document.text for document in request.documents],
        batch_size=64,
        normalize_embeddings=True,
    )

    scores = document_embeddings @ query_embedding
    ranked = sorted(
        zip(request.documents, scores), key=lambda pair: pair[1], reverse=True
    )[: request.top_n]

    return {
        "matches": [
            {"id": document.id, "score": round(float(score), 4)}
            for document, score in ranked
        ]
    }