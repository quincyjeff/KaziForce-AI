"""
Benchmark Vector Matching Performance for KaziForce-AI
Measures dot-product scoring latency against pre-computed candidate embeddings.
"""

import time
import numpy as np


def benchmark_dot_product(num_resumes: int, embedding_dim: int = 384, iterations: int = 50):
    np.random.seed(42)
    # Generate random normalized 384-dimensional vectors
    query = np.random.randn(embedding_dim).astype(np.float32)
    query /= np.linalg.norm(query)

    matrix = np.random.randn(num_resumes, embedding_dim).astype(np.float32)
    matrix /= np.linalg.norm(matrix, axis=1, keepdims=True)

    latencies = []
    # Warmup
    for _ in range(5):
        _ = matrix @ query

    for _ in range(iterations):
        start = time.perf_counter()
        scores = matrix @ query
        top_k = np.argpartition(scores, -10)[-10:]
        _ = sorted(zip(top_k, scores[top_k]), key=lambda x: x[1], reverse=True)
        latencies.append((time.perf_counter() - start) * 1000.0)

    mean_ms = np.mean(latencies)
    p95_ms = np.percentile(latencies, 95)
    max_ms = np.max(latencies)

    return mean_ms, p95_ms, max_ms


def main():
    print("=" * 65)
    print("  KaziForce-AI: Vector Embedding Matching Latency Benchmark")
    print("=" * 65)
    print(f"{'Candidates':<12} | {'Mean Latency':<14} | {'P95 Latency':<14} | {'Status (<50ms)'}")
    print("-" * 65)

    scales = [100, 500, 1000, 2500, 5000, 10000]
    for n in scales:
        mean_ms, p95_ms, max_ms = benchmark_dot_product(n)
        status = "PASSED (Sub-50ms)" if p95_ms < 50.0 else "FAILED"
        print(f"{n:<12} | {mean_ms:6.3f} ms      | {p95_ms:6.3f} ms      | {status}")
        assert p95_ms < 50.0, f"Benchmark failed for {n} candidates: {p95_ms}ms >= 50ms"

    print("=" * 65)
    print("All vector matching scale benchmarks passed successfully!")


if __name__ == "__main__":
    main()
