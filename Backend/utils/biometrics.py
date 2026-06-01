import cv2
import numpy as np
import base64
import json
import os
import traceback
# Lazy loader for DeepFace to prevent startup crashes on micro instances
def get_deepface():
    try:
        from deepface import DeepFace
        return DeepFace
    except (ImportError, Exception) as e:
        print(f"[DeepFace] Lazy-load warning: {e}")
        return None


def _decode_base64_to_img(base64_img: str):
    """Decode a base64 string to an OpenCV BGR image with CLAHE preprocessing."""
    img_data = base64.b64decode(base64_img.split(",")[1] if "," in base64_img else base64_img)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    # CLAHE (Contrast Limited Adaptive Histogram Equalization) for lighting normalization
    # This is what phone cameras do internally to handle varying lighting conditions
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    return img


def get_face_embedding(base64_img: str) -> list[float] | None:
    """
    Extracts a highly robust 512D embedding from a single base64 image
    using DeepFace (Facenet512) with RetinaFace detector and CLAHE preprocessing.
    """
    try:
        img = _decode_base64_to_img(base64_img)
        if img is None:
            return None

        DeepFace = get_deepface()
        if DeepFace is None:
            return None

        embedding_objs = DeepFace.represent(
            img_path=img,
            model_name="Facenet512",
            detector_backend="opencv", # Optimized for speed
            enforce_detection=True
        )

        if not embedding_objs:
            return None

        return embedding_objs[0]["embedding"]
    except Exception as e:
        print(f"[DeepFace] Embedding extraction error: {e}")
        return None


def get_multi_face_embeddings(base64_images: list[str]) -> list[list[float]]:
    """
    PHONE-GRADE ENROLLMENT: Extracts embeddings from multiple face images.
    Skips any frames where face detection fails.
    Returns a list of valid 512D embeddings.
    """
    embeddings = []
    for i, img_b64 in enumerate(base64_images):
        emb = get_face_embedding(img_b64)
        if emb is not None:
            embeddings.append(emb)
            print(f"[DeepFace] Frame {i+1}/{len(base64_images)}: Embedding extracted ✓")
        else:
            print(f"[DeepFace] Frame {i+1}/{len(base64_images)}: No face detected, skipping")
    return embeddings


def compare_faces(known_embedding_json: str, incoming_base64: str, threshold: float = 0.35) -> bool:
    """
    Legacy single-frame comparison. Kept for backward compatibility.
    """
    try:
        known_vector = np.array(json.loads(known_embedding_json))
        incoming_vector = get_face_embedding(incoming_base64)

        if incoming_vector is None:
            return False

        incoming_vector = np.array(incoming_vector)
        cosine_distance = _cosine_distance(known_vector, incoming_vector)

        if cosine_distance is None:
            return False

        print(f"[DeepFace] Cosine Distance: {cosine_distance:.4f} (Threshold: <= {threshold})")
        return cosine_distance <= threshold
    except Exception as e:
        print(f"[DeepFace] Comparison error: {traceback.format_exc()}")
        return False


def compare_faces_multi(
    known_embeddings_json: str,
    incoming_base64_list: list[str],
    threshold: float = 0.35
) -> bool:
    """
    PHONE-GRADE VERIFICATION: Compares multiple incoming frames against
    multiple stored enrollment embeddings.

    Strategy: For each incoming frame, compute cosine distance against every
    stored embedding. The BEST (smallest) distance across all pairs is used
    for the final decision. This is how phone Face ID works — it only needs
    ONE strong match out of all the cross-comparisons.

    Returns True if best_distance <= threshold.
    """
    try:
        known_embeddings = json.loads(known_embeddings_json)

        # Handle both legacy single-embedding and new multi-embedding format
        if isinstance(known_embeddings[0], (int, float)):
            # Legacy: single flat embedding stored, wrap it in a list
            known_embeddings = [known_embeddings]

        known_vectors = [np.array(e) for e in known_embeddings]

        # Extract embeddings from all incoming frames
        incoming_vectors = []
        for i, img_b64 in enumerate(incoming_base64_list):
            emb = get_face_embedding(img_b64)
            if emb is not None:
                incoming_vectors.append(np.array(emb))
                print(f"[DeepFace] Login frame {i+1}: Embedding extracted ✓")
            else:
                print(f"[DeepFace] Login frame {i+1}: No face detected, skipping")

        if not incoming_vectors:
            print("[DeepFace] No valid face detected in any login frame.")
            return False

        # Cross-compare: find the best (minimum) cosine distance across all pairs
        best_distance = float('inf')
        for ki, kv in enumerate(known_vectors):
            for ii, iv in enumerate(incoming_vectors):
                dist = _cosine_distance(kv, iv)
                if dist is not None and dist < best_distance:
                    best_distance = dist
                    print(f"[DeepFace] Pair (enrolled[{ki}] vs login[{ii}]): distance={dist:.4f}")

        if best_distance == float('inf'):
            return False

        print(f"[DeepFace] ★ Best Distance: {best_distance:.4f} (Threshold: <= {threshold})")
        return best_distance <= threshold

    except Exception as e:
        print(f"[DeepFace] Multi-comparison error: {traceback.format_exc()}")
        return False


def _cosine_distance(vec_a: np.ndarray, vec_b: np.ndarray) -> float | None:
    """Calculate cosine distance between two vectors. Returns None on error."""
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return None
    similarity = np.dot(vec_a, vec_b) / (norm_a * norm_b)
    return 1 - similarity
