from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")


class Document(BaseModel):
    id: int
    text: str | None = None
    embedding: list[float] | None = None


class EmbedRequest(BaseModel):
    text: str


class MatchRequest(BaseModel):
    query_text: str | None = None
    query_embedding: list[float] | None = None
    documents: list[Document]
    top_n: int = 10


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed")
def embed(request: EmbedRequest):
    embedding = model.encode(request.text, normalize_embeddings=True)
    return {"embedding": embedding.tolist()}


@app.post("/match")
def match(request: MatchRequest):
    if not request.documents:
        return {"matches": []}

    # Determine query embedding
    if request.query_embedding is not None:
        query_vec = np.array(request.query_embedding, dtype=np.float32)
    elif request.query_text:
        query_vec = model.encode(request.query_text, normalize_embeddings=True)
    else:
        return {"matches": []}

    # Extract or compute document embeddings
    doc_vectors = []
    docs_to_encode_indices = []
    texts_to_encode = []

    for idx, doc in enumerate(request.documents):
        if doc.embedding is not None and len(doc.embedding) > 0:
            doc_vectors.append(np.array(doc.embedding, dtype=np.float32))
        else:
            doc_vectors.append(None)
            docs_to_encode_indices.append(idx)
            texts_to_encode.append(doc.text or "")

    # Encode any documents missing an embedding on the fly
    if texts_to_encode:
        computed = model.encode(texts_to_encode, batch_size=64, normalize_embeddings=True)
        for i, real_idx in enumerate(docs_to_encode_indices):
            doc_vectors[real_idx] = computed[i]

    doc_matrix = np.vstack(doc_vectors)
    scores = doc_matrix @ query_vec

    ranked = sorted(
        zip(request.documents, scores), key=lambda pair: pair[1], reverse=True
    )[: request.top_n]

    return {
        "matches": [
            {"id": document.id, "score": round(float(score), 4)}
            for document, score in ranked
        ]
    }
