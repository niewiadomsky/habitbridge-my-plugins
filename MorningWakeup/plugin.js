app.init(() => {
  // Time window configuration (in 24-hour format)
  const MORNING_START_HOUR = 5;      // 5:00
  const MORNING_START_MINUTE = 0;    // 0 minutes
  const MORNING_END_HOUR = 7;        // 7:00
  const MORNING_END_MINUTE = 15;      // 0 minutes
  
  let videoStream = null;
  let scanningInterval = null;

  // Check if current time is within morning window
  function isWithinMorningWindow() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert times to minutes since midnight for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = MORNING_START_HOUR * 60 + MORNING_START_MINUTE;
    const endTimeInMinutes = MORNING_END_HOUR * 60 + MORNING_END_MINUTE;
    
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
  }
  
  // Format time window for display (24-hour format)
  function formatTimeWindow(hour, minute) {
    const displayHour = hour.toString().padStart(2, '0');
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute}`;
  }

  // Format time for display (24-hour format)
  function getCurrentTimeString() {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  // Update time display
  function updateTimeDisplay() {
    const timeElement = document.getElementById('current-time');
    const statusElement = document.getElementById('status');
    
    if (timeElement) {
      timeElement.textContent = getCurrentTimeString();
    }
    
    if (statusElement) {
      if (isWithinMorningWindow()) {
        statusElement.textContent = '✅ Within morning window - Ready to scan!';
        statusElement.className = 'status-valid';
      } else {
        const startTime = formatTimeWindow(MORNING_START_HOUR, MORNING_START_MINUTE);
        const endTime = formatTimeWindow(MORNING_END_HOUR, MORNING_END_MINUTE);
        statusElement.textContent = `⏰ Outside morning window (${startTime} - ${endTime})`;
        statusElement.className = 'status-invalid';
      }
    }
  }

  // Start camera and QR scanning
  window.startScanning = async () => {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const context = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const scanResult = document.getElementById('scan-result');

    try {
      // Request camera access
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      video.srcObject = videoStream;
      video.setAttribute('playsinline', true);
      video.play();

      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      video.style.display = 'block';

      // Start scanning loop
      scanningInterval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            handleQRCodeScanned(code.data);
          }
        }
      }, 300);

    } catch (error) {
      scanResult.textContent = '❌ Camera access denied or unavailable';
      scanResult.className = 'result-error';
      console.error('Camera error:', error);
    }
  };

  // Stop camera and scanning
  window.stopScanning = () => {
    const video = document.getElementById('qr-video');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }

    if (scanningInterval) {
      clearInterval(scanningInterval);
      scanningInterval = null;
    }

    video.style.display = 'none';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
  };

  // Handle successful QR code scan
  function handleQRCodeScanned(data) {
    const scanResult = document.getElementById('scan-result');
    
    // Stop scanning
    window.stopScanning();

    if (!isWithinMorningWindow()) {
      const startTime = formatTimeWindow(MORNING_START_HOUR, MORNING_START_MINUTE);
      const endTime = formatTimeWindow(MORNING_END_HOUR, MORNING_END_MINUTE);
      scanResult.textContent = `⏰ QR code detected, but it's outside morning hours (${startTime} - ${endTime})`;
      scanResult.className = 'result-error';
      return;
    }

    // Success! Complete the habit
    scanResult.textContent = `✅ QR Code scanned successfully at ${getCurrentTimeString()}!`;
    scanResult.className = 'result-success';
    
    // Delay completion slightly to show success message
    setTimeout(() => {
      app.complete();
    }, 1500);
  }

  // Render the plugin UI
  app.renderHTML(`
    <div class="morning-wakeup-container">
      <h1>🌅 Morning Wake Up</h1>
      <p class="subtitle">Scan your QR code to complete your morning routine</p>
      
      <div class="time-info">
        <div class="current-time">
          <strong>Current Time:</strong>
          <span id="current-time">${getCurrentTimeString()}</span>
        </div>
        <div id="status" class="status"></div>
      </div>

      <div class="scanner-container">
        <video id="qr-video" playsinline></video>
        <canvas id="qr-canvas" style="display: none;"></canvas>
        
        <div class="controls">
          <button id="start-btn" onclick="startScanning()" class="btn btn-primary">
            📷 Start Camera
          </button>
          <button id="stop-btn" onclick="stopScanning()" class="btn btn-secondary" style="display: none;">
            🛑 Stop Camera
          </button>
        </div>
        
        <div id="scan-result" class="scan-result"></div>
      </div>

      <div class="instructions">
        <h3>📋 Instructions:</h3>
        <ol>
          <li>Make sure it's between ${formatTimeWindow(MORNING_START_HOUR, MORNING_START_MINUTE)} and ${formatTimeWindow(MORNING_END_HOUR, MORNING_END_MINUTE)}</li>
          <li>Click "Start Camera" to activate the scanner</li>
          <li>Point your camera at your morning QR code</li>
          <li>The habit will be marked complete automatically!</li>
        </ol>
      </div>
    </div>

    <style>
      .morning-wakeup-container {
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      h1 {
        text-align: center;
        color: #2c3e50;
        margin-bottom: 10px;
      }

      .subtitle {
        text-align: center;
        color: #7f8c8d;
        margin-bottom: 30px;
      }

      .time-info {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .current-time {
        font-size: 18px;
        margin-bottom: 10px;
      }

      #current-time {
        display: block;
        font-size: 32px;
        font-weight: bold;
        margin-top: 8px;
      }

      .status {
        font-size: 16px;
        padding: 10px;
        border-radius: 8px;
        margin-top: 15px;
        text-align: center;
        font-weight: 600;
      }

      .status-valid {
        background: rgba(46, 213, 115, 0.2);
        border: 2px solid rgba(46, 213, 115, 0.5);
      }

      .status-invalid {
        background: rgba(255, 107, 107, 0.2);
        border: 2px solid rgba(255, 107, 107, 0.5);
      }

      .scanner-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 30px;
        text-align: center;
      }

      #qr-video {
        width: 100%;
        max-width: 400px;
        border-radius: 12px;
        margin-bottom: 20px;
        display: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .controls {
        margin: 20px 0;
      }

      .btn {
        padding: 14px 28px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 5px;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: #e74c3c;
        color: white;
      }

      .btn-secondary:hover {
        background: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(231, 76, 60, 0.4);
      }

      .scan-result {
        margin-top: 20px;
        padding: 15px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        min-height: 20px;
      }

      .result-success {
        background: #d4edda;
        color: #155724;
        border: 2px solid #c3e6cb;
      }

      .result-error {
        background: #f8d7da;
        color: #721c24;
        border: 2px solid #f5c6cb;
      }

      .instructions {
        background: #fff3cd;
        padding: 20px;
        border-radius: 12px;
        border-left: 4px solid #ffc107;
      }

      .instructions h3 {
        margin-top: 0;
        color: #856404;
      }

      .instructions ol {
        margin: 10px 0;
        padding-left: 25px;
        color: #856404;
      }

      .instructions li {
        margin: 8px 0;
        line-height: 1.6;
      }
    </style>

    <!-- Load jsQR library for QR code scanning -->
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
  `);

  // Update time display every second
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);
});

