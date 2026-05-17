import numpy as np

def euclidean(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

# Eye Aspect Ratio
def compute_EAR(eye):
    A = euclidean(eye[1], eye[5])
    B = euclidean(eye[2], eye[4])
    C = euclidean(eye[0], eye[3])
    return (A + B) / (2.0 * C)

# Mouth Aspect Ratio
def compute_MAR(mouth):
    top = mouth[0]   # upper lip
    bottom = mouth[1]  # lower lip
    left = mouth[2]
    right = mouth[3]

    vertical = np.linalg.norm(np.array(top) - np.array(bottom))
    horizontal = np.linalg.norm(np.array(left) - np.array(right))

    return vertical / horizontal