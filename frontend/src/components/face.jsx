import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

function Face() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [startTime, setStartTime] = useState(null);

  const TARGET_DURATION = 5 * 60 * 1000; // 5 minutes
  const [EARvalue, setEAR] = useState(0);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);

  function calcEAR(landmarks, eye) {
    const [a, b, c, d, e, f] = eye;
    const vertical1 = Math.hypot(landmarks[b].x - landmarks[e].x, landmarks[b].y - landmarks[e].y);
    const vertical2 = Math.hypot(landmarks[c].x - landmarks[d].x, landmarks[c].y - landmarks[d].y);
    const horizontal = Math.hypot(landmarks[a].x - landmarks[f].x, landmarks[a].y - landmarks[f].y);
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  const onResults = (results) => {
    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, 640, 480);
    canvasCtx.drawImage(results.image, 0, 0, 640, 480);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      const leftEyeIdx = [33, 160, 158, 153, 144, 133];
      const rightEyeIdx = [362, 385, 387, 373, 380, 263];

      const leftEAR = calcEAR(landmarks, leftEyeIdx);
      const rightEAR = calcEAR(landmarks, rightEyeIdx);
      const avgEAR = (leftEAR + rightEAR) / 2;
      setEAR(avgEAR.toFixed(3));

      [...leftEyeIdx, ...rightEyeIdx].forEach((i) => {
        const x = landmarks[i].x * 640;
        const y = landmarks[i].y * 480;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);
        canvasCtx.fillStyle = "cyan";
        canvasCtx.fill();
      });

      if (avgEAR < 0.21) {
        if (!startTime) setStartTime(Date.now());
        else {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, TARGET_DURATION - elapsed);
          if (remaining === 0) {
            setStatus("✅ Meditation Complete!");
          } else {
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setStatus(`🧘‍♂️ Meditating... ${mins}:${secs.toString().padStart(2, "0")}`);
          }
        }
      } else {
        setStartTime(null);
        setStatus("👀 Eyes opened! Timer reset.");
      }
    } else {
      setStatus("😐 No face detected");
      setStartTime(null);
    }

    canvasCtx.restore();
  };

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ transform: "scaleX(-1)", display: "block" }}
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "scaleX(-1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "10px 20px",
          borderRadius: "10px",
          fontSize: "18px",
        }}
      >
        {status} | EAR: {EARvalue}
      </div>
    </div>
  );
}

export default Face;
