import cv2
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh

cap = cv2.VideoCapture(0)

with mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
) as face_mesh:

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        frame = cv2.flip(frame, 1)

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = face_mesh.process(rgb)

        h, w, _ = frame.shape

        if results.multi_face_landmarks:

            for face_landmarks in results.multi_face_landmarks:

                # Nose landmark
                nose = face_landmarks.landmark[1]

                nx = int(nose.x * w)
                ny = int(nose.y * h)

                cv2.circle(frame, (nx, ny), 5, (0, 255, 0), -1)

                # Left eye center
                left_eye = face_landmarks.landmark[468]

                lx = int(left_eye.x * w)
                ly = int(left_eye.y * h)

                cv2.circle(frame, (lx, ly), 5, (255, 0, 0), -1)

                # Right eye center
                right_eye = face_landmarks.landmark[473]

                rx = int(right_eye.x * w)
                ry = int(right_eye.y * h)

                cv2.circle(frame, (rx, ry), 5, (0, 0, 255), -1)

                # Face bounding box
                xs = [lm.x for lm in face_landmarks.landmark]
                ys = [lm.y for lm in face_landmarks.landmark]

                x_min = int(min(xs) * w)
                y_min = int(min(ys) * h)

                x_max = int(max(xs) * w)
                y_max = int(max(ys) * h)

                cv2.rectangle(
                    frame,
                    (x_min, y_min),
                    (x_max, y_max),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Eyes: ({lx},{ly}) ({rx},{ry})",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )

        cv2.imshow("Face & Eye Tracking", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()