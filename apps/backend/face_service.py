"""ArcFace face recognition service with ONNX inference."""

import cv2
import numpy as np
import onnxruntime as ort
from typing import Optional, Dict, List, Any


class ArcFaceEmbedder:
    """ArcFace ONNX model wrapper for extracting face embeddings.
    
    Handles preprocessing, inference, and normalization for ArcFace model.
    Includes face detection via HaarCascade.
    """

    def __init__(self, model_path: str):
        """Initialize embedder with ONNX model.
        
        Args:
            model_path: Path to ArcFace ONNX model file.
        
        Raises:
            FileNotFoundError: If model file not found.
            RuntimeError: If ONNX session initialization fails.
        """
        self.session = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        self.face_detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

    @staticmethod
    def _preprocess(img_path: str, size: tuple = (112, 112)) -> Optional[np.ndarray]:
        """Preprocess image for ArcFace inference.
        
        Steps:
        1. Read image as BGR
        2. Convert BGR → RGB
        3. Resize to 112×112
        4. Normalize: (x - 127.5) / 128.0
        
        Args:
            img_path: Path to input image.
            size: Target size (H, W).
        
        Returns:
            Preprocessed image tensor shape (1, H, W, 3) or None if read fails.
        """
        img = cv2.imread(img_path)
        if img is None:
            return None
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, size)
        img = (img.astype(np.float32) - 127.5) / 128.0
        return img[np.newaxis, ...]

    def get_embedding(self, img_path: str) -> Optional[np.ndarray]:
        """Extract normalized face embedding from image.
        
        Args:
            img_path: Path to face image.
        
        Returns:
            Normalized embedding vector (512-dim) or None if extraction fails.
        """
        input_blob = self._preprocess(img_path)
        if input_blob is None:
            return None
        
        embedding = self.session.run(
            [self.output_name], {self.input_name: input_blob}
        )[0][0]
        embedding = embedding.astype(np.float32)
        
        norm = np.linalg.norm(embedding)
        if norm < 1e-10:
            return None
        return embedding / norm

    def count_faces(self, img_path: str) -> Optional[int]:
        """Detect and count faces in image.
        
        Args:
            img_path: Path to image.
        
        Returns:
            Number of detected faces, None if detector unavailable, 0 if read fails.
        """
        if self.face_detector.empty():
            return None
        
        img = cv2.imread(img_path)
        if img is None:
            return 0
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_detector.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
        )
        return int(len(faces))


class FaceRecognitionService:
    """Face recognition service using ArcFace cosine similarity matching.
    
    Compares query face embeddings against enrolled database using
    vectorized cosine similarity for fast batch matching.
    """

    def __init__(self, arcface_model_path: str):
        """Initialize face recognition service.
        
        Args:
            arcface_model_path: Path to ArcFace ONNX model.
        """
        self.embedder = ArcFaceEmbedder(arcface_model_path)

    @staticmethod
    def _safe_normalize(vec: np.ndarray) -> Optional[np.ndarray]:
        """Safely normalize vector with numerical stability check.
        
        Args:
            vec: Input vector.
        
        Returns:
            Normalized vector or None if norm is too small.
        """
        norm = np.linalg.norm(vec)
        if norm < 1e-10:
            return None
        return vec / norm

    def recognize_face(
        self,
        image_path: str,
        enrolled_embeddings: List[Dict[str, Any]],
        threshold: float = 0.68,
    ) -> Optional[Dict[str, Any]]:
        """Match query face against enrolled embeddings using cosine similarity.
        
        Performs vectorized batch matching for efficiency:
        1. Extract query embedding
        2. Normalize candidates
        3. Compute cosine similarities via matrix multiplication
        4. Return best match and scores
        
        Args:
            image_path: Path to query face image.
            enrolled_embeddings: List of dicts with 'embedding' key.
            threshold: Cosine similarity threshold [0, 1]. Default 0.68.
        
        Returns:
            Dict with match result and scores, None if no match or extraction fails.
            Keys: face_data, similarity, cosine_similarity, confidence, distance,
                  threshold, accepted.
        """
        query = self.embedder.get_embedding(image_path)
        if query is None or not enrolled_embeddings:
            return None

        threshold = float(threshold)

        candidates = []
        vectors = []

        for data in enrolled_embeddings:
            vec = np.asarray(data["embedding"], dtype=np.float32).reshape(-1)
            
            if vec.size != query.size:
                continue
            
            normalized = self._safe_normalize(vec)
            if normalized is None:
                continue
            
            vectors.append(normalized)
            candidates.append(data)

        if not vectors:
            return None

        matrix = np.vstack(vectors)
        scores = matrix @ query
        
        best_idx = int(np.argmax(scores))
        best_score = float(scores[best_idx])
        best_match = candidates[best_idx]

        dist_value = max(0.0, 1.0 - best_score)
        is_accepted = best_score >= threshold
        
        sim_score = round(best_score, 4)
        dist_score = round(dist_value, 4)
        threshold_rounded = round(threshold, 4)

        return {
            "face_data": best_match,
            "similarity": sim_score,
            "cosine_similarity": sim_score,
            "confidence": sim_score,
            "distance": dist_score,
            "threshold": threshold_rounded,
            "accepted": is_accepted,
        }

    def extract_embedding(self, image_path: str) -> Optional[List[float]]:
        """Extract and return embedding as JSON-serializable list.
        
        Args:
            image_path: Path to face image.
        
        Returns:
            Embedding as list of floats, None if extraction fails.
        """
        embedding = self.embedder.get_embedding(image_path)
        return embedding.tolist() if embedding is not None else None

    def detect_face_count(self, image_path: str) -> Optional[int]:
        """Count detected faces in image.
        
        Args:
            image_path: Path to image.
        
        Returns:
            Number of faces or None if detector unavailable.
        """
        return self.embedder.count_faces(image_path)
