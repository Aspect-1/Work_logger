let activeSeconds = 0; 
let idleSeconds = 0;
window.isFaceDetected = false;  // Global flag for face detection

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Loading face-api model...");
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny-face-detector");
  console.log("Model loaded");

  const webcam = document.getElementById("webcam");

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      webcam.srcObject = stream;
    })
    .catch(console.error);

  webcam.addEventListener("loadeddata", () => {
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        webcam,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 0) {
        activeSeconds++;
        window.isFaceDetected = true;
      } else {
        idleSeconds++;
        window.isFaceDetected = false;
      }

      document.getElementById("active-time").textContent = activeSeconds + "s";
      document.getElementById("idle-time").textContent = idleSeconds + "s";
    }, 1000);
  });
});
