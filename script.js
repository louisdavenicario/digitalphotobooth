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
                    width: { ideal: 1800 },
                    height: { ideal: 2400 },
                    aspectRatio: 3 / 4,
                    facingMode: "user"
                }
            });
            video.srcObject = stream;

            //force proper orientation
            video.onloadedmetadata = () =>{
                video.style.transform = "rotate(0deg) scaleX(-1)";
            }
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

    // Countdown before each photo capture
    function captureNextPhoto() {
        if (captureCount < 4) {
            shutterBtn.innerText = `Capturing in 3...`;
            setTimeout(() => {
                shutterBtn.innerText = `Capturing in 2...`;
                setTimeout(() => {
                    shutterBtn.innerText = `Capturing in 1...`;
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

    function capturePhoto() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
    
        // Ensure the canvas has the correct 3:4 aspect ratio
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        const canvasAspectRatio = 3 / 4;
    
        let sx, sy, sw, sh;
        if (videoAspectRatio > canvasAspectRatio) {
            sw = video.videoHeight * canvasAspectRatio;
            sh = video.videoHeight;
            sx = (video.videoWidth - sw) / 2;
            sy = 0;
        } else {
            sw = video.videoWidth;
            sh = video.videoWidth / canvasAspectRatio;
            sx = 0;
            sy = (video.videoHeight - sh) / 2;
        }
    
        canvas.width = 300; // Set a fixed width for preview
        canvas.height = 400; // Keep the 3:4 aspect ratio
    
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
        // Create preview image
        const img = new Image();
        img.src = canvas.toDataURL("image/png");
    
        // Apply styling to prevent stretching
        img.style.width = "auto"; // Maintain original aspect ratio
        img.style.height = "100px"; // Set a consistent height
    
        capturedImages.push(img.src);
        photoStrip.appendChild(img);
    }
    

    // Show the final print layout after capturing all photos
    function showPrintPage() {
        cameraPage.classList.add("d-none");
        printPage.classList.remove("d-none");

        // Show "Processing..." message before applying filter and grain
        const processingMessage = document.createElement("p");
        processingMessage.innerText = "Processing...";
        processingMessage.id = "processing-message";
        printPage.appendChild(processingMessage);

        const ctx = finalCanvas.getContext("2d");
        finalCanvas.width = FRAME_WIDTH;
        finalCanvas.height = FRAME_HEIGHT;

        ctx.filter = "grayscale(1) contrast(1.4) brightness(1.1) sepia(0.1)";

        let imagesLoaded = 0;

        capturedImages.forEach((imgSrc, index) => {
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                ctx.drawImage(img, 0, index * (FRAME_HEIGHT / 4), FRAME_WIDTH, FRAME_HEIGHT / 4);
                imagesLoaded++;

                // Once all images are loaded, apply final effects
                if (imagesLoaded === 4) {
                    ctx.filter = "none";

                    // Apply subtle grain effect
                    ctx.globalAlpha = 0.1;
                    for (let i = 0; i < finalCanvas.width; i += 2) {
                        for (let j = 0; j < finalCanvas.height; j += 2) {
                            const gray = Math.random() * 200 + 30;
                            ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
                            ctx.fillRect(i, j, 1.8, 1.8);
                        }
                    }
                    ctx.globalAlpha = 1;

                    // ✅ ADD FRAME AFTER FILTERS AND GRAIN
                    const frame = new Image();
                    frame.src = "frame.png";
                    frame.onload = () => {
                        ctx.drawImage(frame, 0, 0, finalCanvas.width, finalCanvas.height);

                        // Remove "Processing..." message after rendering
                        setTimeout(() => {
                            const processingMsg = document.getElementById("processing-message");
                            if (processingMsg) processingMsg.remove();
                            downloadBtn.classList.remove("d-none"); // Show download button
                        }, 500);
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
        shutterBtn.innerHTML = '<i class="fa-solid fa-camera fa-2x"></i>';

    });
});
