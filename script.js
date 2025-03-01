document.addEventListener("DOMContentLoaded", () => {
    const welcomeScreen = document.getElementById("welcome-screen");
    const cameraPage = document.getElementById("camera-page");
    const printPage = document.getElementById("print-page");
    const video = document.getElementById("camera");
    const shutterBtn = document.getElementById("shutter-btn");
    const photoStrip = document.getElementById("photo-strip");
    const finalCanvas = document.getElementById("final-image");
    const downloadBtn = document.getElementById("download-btn");
    const backBtn = document.getElementById("back-btn");

    let stream;
    let capturedImages = [];
    let captureCount = 0;

    const FRAME_WIDTH = 383;
    const FRAME_HEIGHT = 2048;

    // Hide welcome screen on tap and show camera
    welcomeScreen.addEventListener("click", () => {
        welcomeScreen.classList.add("d-none");
        cameraPage.classList.remove("d-none");
        startCamera();
    });

    // Start the camera with a portrait aspect ratio
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    aspectRatio: 9 / 16, 
                    facingMode: "user"
                }
            });
            video.srcObject = stream;
        } catch (error) {
            alert("Camera access denied!");
        }
    }

    // Capture 4 photos with a 3-second countdown before each capture
    shutterBtn.addEventListener("click", () => {
        shutterBtn.disabled = true;
        captureCount = 0;
        capturedImages = [];
        photoStrip.innerHTML = "";

        captureNextPhoto();
    });

    // Previous working countdown logic
    function captureNextPhoto() {
        if (captureCount < 4) {
            shutterBtn.innerText = `📸 Capturing in 3...`;
            setTimeout(() => {
                shutterBtn.innerText = `📸 Capturing in 2...`;
                setTimeout(() => {
                    shutterBtn.innerText = `📸 Capturing in 1...`;
                    setTimeout(() => {
                        capturePhoto();
                        captureCount++;
                        if (captureCount < 4) {
                            captureNextPhoto();
                        } else {
                            setTimeout(() => showPrintPage(), 1000);
                        }
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    }

    // Capture a single photo from the video stream (with mirror correction)
    function capturePhoto() {
        const canvas = document.createElement("canvas");
        canvas.width = FRAME_WIDTH;
        canvas.height = FRAME_HEIGHT / 4;
        const ctx = canvas.getContext("2d");

        ctx.save();
        ctx.scale(-1, 1); // Fix mirrored image
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        const img = new Image();
        img.src = canvas.toDataURL("image/png");
        capturedImages.push(img.src);
        photoStrip.appendChild(img);
    }

    // Show the final print layout after capturing all photos
    function showPrintPage() {
        cameraPage.classList.add("d-none");
        printPage.classList.remove("d-none");

        const ctx = finalCanvas.getContext("2d");
        finalCanvas.width = FRAME_WIDTH;
        finalCanvas.height = FRAME_HEIGHT;

        ctx.filter = "grayscale(1) contrast(1.4) brightness(0.9) sepia(0.2)";

        capturedImages.forEach((imgSrc, index) => {
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                ctx.drawImage(img, 0, index * (FRAME_HEIGHT / 4), FRAME_WIDTH, FRAME_HEIGHT / 4);
                
                if (index === 3) {
                    ctx.filter = "none";

                    const frame = new Image();
                    frame.src = "frame.png";  
                    frame.onload = () => {
                        ctx.drawImage(frame, 0, 0, finalCanvas.width, finalCanvas.height);

                        ctx.globalAlpha = 0.1;
                        for (let i = 0; i < finalCanvas.width; i += 2) {
                            for (let j = 0; j < finalCanvas.height; j += 2) {
                                const gray = Math.random() * 200 + 30;
                                ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
                                ctx.fillRect(i, j, 2, 2);
                            }
                        }
                        ctx.globalAlpha = 1;
                    };
                }
            };
        });
    }

    // Download the final photobooth print
    downloadBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = "photobooth.png";
        link.href = finalCanvas.toDataURL("image/png");
        link.click();
    });

    // Go back to camera mode
    backBtn.addEventListener("click", () => {
        printPage.classList.add("d-none");
        cameraPage.classList.remove("d-none");
        photoStrip.innerHTML = "";
        shutterBtn.disabled = false;
        shutterBtn.innerText = "📸 Capture";
    });
});
