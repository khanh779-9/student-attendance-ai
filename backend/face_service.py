import cv2
import numpy as np
import onnxruntime as ort


class ArcFaceEmbedder:
    """Minimal ArcFace ONNX embedder."""

    def __init__(self, model_path):
        self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def count_faces(self, img_path):
        """Return number of detected faces. Returns None if detector is unavailable."""
        if self.face_cascade.empty():
            return None
        img = cv2.imread(img_path)
        if img is None:
            return 0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40),
        )
        return int(len(faces))

    @staticmethod
    def _preprocess(img_path, size=(112, 112)):
        img = cv2.imread(img_path)
        if img is None:
            return None
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, size)
        img = (img.astype(np.float32) - 127.5) / 128.0
        return img[np.newaxis, ...]

    def get_embedding(self, img_path):
        input_blob = self._preprocess(img_path)
        if input_blob is None:
            return None
        embedding = self.session.run([self.output_name], {self.input_name: input_blob})[0][0]
        embedding = embedding.astype(np.float32)
        norm = np.linalg.norm(embedding)
        return embedding / norm if norm > 0 else None


class FaceRecognitionService:
    """Face recognition service using ArcFace cosine similarity."""

    def __init__(self, arcface_model_path):
        self.embedder = ArcFaceEmbedder(arcface_model_path)

    @staticmethod
    def _cosine_similarity(vec1, vec2):
        """Compute cosine similarity with safe normalization."""
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return None
        return float(np.dot(vec1 / norm1, vec2 / norm2))

    def recognize_face(self, image_path, enrolled_embeddings, threshold=0.04223):
        input_embedding = self.embedder.get_embedding(image_path)
        if input_embedding is None or not enrolled_embeddings:
            return None

        best_data = None
        best_similarity = -1.0
        for enrolled_data in enrolled_embeddings:
            enrolled_embedding = np.asarray(enrolled_data["embedding"], dtype=np.float32)
            if enrolled_embedding.shape != input_embedding.shape:
                # Skip malformed or legacy embeddings to avoid shape mismatch errors.
                continue
            cosine_sim = self._cosine_similarity(input_embedding, enrolled_embedding)
            if cosine_sim is None:
                continue
            if cosine_sim > best_similarity:
                best_similarity = cosine_sim
                best_data = enrolled_data

        if best_data is None:
            return None

        confidence = round(best_similarity, 4)
        distance = round(1 - confidence, 4)
        threshold = round(threshold, 4)
        
        print(f"Best match with cosine similarity (confidence): {confidence}, distance: {distance}, threshold: {threshold}")

        return {
            "face_data": best_data,
            "cosine_similarity": confidence,
            "accepted": confidence > threshold,
            "confidence": confidence,
            "distance": distance,
            "threshold": threshold
        }

    def extract_embedding(self, image_path):
        embedding = self.embedder.get_embedding(image_path)
        return embedding.tolist() if embedding is not None else None

    def detect_face_count(self, image_path):
        return self.embedder.count_faces(image_path)
