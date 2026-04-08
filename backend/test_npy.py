import os
import numpy as np

DATA_DIR = os.path.join('data', 'student')

def check_npy_files():
    if not os.path.exists(DATA_DIR):
        print(f"Directory not found: {DATA_DIR}")
        return
    files = [f for f in os.listdir(DATA_DIR) if f.endswith('.npy')]
    if not files:
        print("No .npy files found.")
        return
    for fname in files:
        print("\n" + "="*40)
        print(f"File: {fname}")
        path = os.path.join(DATA_DIR, fname)
        try:
            arr = np.load(path)
            print(f"  shape={arr.shape}, dtype={arr.dtype}")
            if arr.ndim == 1:
                print(f"  [0]: {arr[:8]} ...")
            else:
                for i, vec in enumerate(arr):
                    print(f"  [{i}]: {vec[:8]} ...")
        except Exception as e:
            print(f"{fname}: ERROR - {e}")
    print("\n" + "="*40 + "\nDone.")

if __name__ == "__main__":
    check_npy_files()
