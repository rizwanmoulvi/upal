import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import jsQR from 'jsqr';
import { X, Zap } from 'lucide-react';

const QRScanner = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const handleManualCapture = async () => {
    if (!videoRef.current) {
      console.log('Video not available for manual capture');
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }

    try {
      console.log('Attempting manual capture...');
      
      const video = videoRef.current;
      
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        alert('Camera is still loading. Please wait a moment and try again.');
        return;
      }
      
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      
      if (canvas.width === 0 || canvas.height === 0) {
        alert('Camera dimensions not available. Please try again.');
        return;
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and scan
      canvas.toBlob(async (blob) => {
        try {
          console.log('=== MANUAL CAPTURE ===');
          const qrData = await scanImageWithMultipleMethods(blob);
          console.log('Manual capture extracted data:', qrData);
          console.log('=== END MANUAL CAPTURE ===');
          
          onScan(qrData);
          stopScanning();
          onClose();
        } catch (scanError) {
          console.log('No QR code detected in manual capture:', scanError);
          alert('No QR code detected. Please ensure the QR code is clearly visible in the camera view and try again.');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Manual capture failed:', error);
      alert('Failed to capture QR code. Please try again or use the upload option.');
    }
  };

  const scanImageWithMultipleMethods = async (imageSource) => {
    console.log('=== TRYING MULTIPLE SCAN METHODS ===');
    
    // Method 1: Try QrScanner library
    try {
      console.log('Method 1: QrScanner library...');
      const result = await QrScanner.scanImage(imageSource);
      console.log('QrScanner success:', result);
      const qrData = result.data || result;
      if (qrData) {
        console.log('QrScanner extracted data:', qrData);
        return qrData;
      }
    } catch (error) {
      console.log('QrScanner failed:', error.message);
    }

    // Method 2: Try jsQR with canvas processing
    try {
      console.log('Method 2: jsQR with canvas...');
      
      // Create image element
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log('Canvas image data:', imageData.width, 'x', imageData.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              console.log('jsQR success:', code.data);
              resolve(code.data);
            } else {
              console.log('jsQR found no QR code');
              reject(new Error('No QR code found with jsQR'));
            }
          } catch (canvasError) {
            console.error('Canvas processing error:', canvasError);
            reject(canvasError);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Handle different image sources
        if (imageSource instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
          };
          reader.readAsDataURL(imageSource);
        } else {
          img.src = imageSource;
        }
      });
    } catch (error) {
      console.log('jsQR method failed:', error.message);
    }

    throw new Error('All QR detection methods failed');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log('=== IMAGE UPLOAD SCAN ===');
      console.log('Scanning uploaded file:', file.name, file.type, file.size);
      
      const qrData = await scanImageWithMultipleMethods(file);
      console.log('Final extracted data:', qrData);
      console.log('=== END IMAGE UPLOAD ===');
      
      onScan(qrData);
      stopScanning();
      onClose();
    } catch (error) {
      console.error('All image scan methods failed:', error);
      
      // Show more helpful error message
      const errorMsg = `No QR code detected in the uploaded image.\n\nTips:\n• Ensure the QR code is clearly visible\n• Try a higher resolution image\n• Make sure there's good contrast\n• Avoid blurry or tilted images\n\nFile: ${file.name} (${Math.round(file.size/1024)}KB)`;
      alert(errorMsg);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      console.log('Manual text input:', textInput.trim());
      onScan(textInput.trim());
      stopScanning();
      onClose();
    }
  };

  useEffect(() => {
    const startScanning = async () => {
      try {
        setIsScanning(true);
        setHasCamera(true);
        
        // Check if camera is available
        const hasCameraAccess = await QrScanner.hasCamera();
        console.log('Camera availability:', hasCameraAccess);
        
        if (!hasCameraAccess) {
          console.log('No camera access available');
          setHasCamera(false);
          setIsScanning(false);
          return;
        }

        if (!videoRef.current) {
          console.log('Video element not ready');
          setHasCamera(false);
          setIsScanning(false);
          return;
        }

        // Create scanner instance
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('=== QR SCANNER RAW RESULT ===');
            console.log('Full result object:', result);
            console.log('Result type:', typeof result);
            
            const qrData = typeof result === 'string' ? result : (result.data || result);
            console.log('Extracted QR Data:', qrData);
            console.log('QR Data length:', qrData?.length);
            console.log('QR Data preview:', qrData?.substring(0, 100));
            console.log('=== END RAW RESULT ===');
            
            onScan(qrData);
            stopScanning();
            onClose();
          },
          {
            returnDetailedScanResult: false, // Simplified result format
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 3,
            preferredCamera: 'environment', // Use back camera on mobile if available
            calcScanRegion: (video) => {
              // Define scan region (center square)
              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanSize = Math.round(0.6 * smallerDimension);
              const x = Math.round((video.videoWidth - scanSize) / 2);
              const y = Math.round((video.videoHeight - scanSize) / 2);
              return { x, y, width: scanSize, height: scanSize };
            }
          }
        );

        console.log('Starting QR scanner...');
        await scannerRef.current.start();
        console.log('QR scanner started successfully');
        
        // Set scanning to true only after successful start
        setIsScanning(true);
      } catch (error) {
        console.error('Failed to start QR scanner:', error);
        setHasCamera(false);
        setIsScanning(false);
        
        // Show user-friendly error message
        if (error.name === 'NotAllowedError') {
          alert('Camera access denied. Please allow camera permission and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found on this device.');
        } else {
          alert('Failed to start camera. Please try uploading an image instead.');
        }
      }
    };

    if (isOpen && videoRef.current) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, onScan, onClose]);  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-sm max-h-screen bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-semibold">Scan QR Code</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scan frame */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-fuchsia-600 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-fuchsia-600 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-fuchsia-600 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-fuchsia-600 rounded-br"></div>
                    
                    {/* Scanning line */}
                    {isScanning && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-fuchsia-600 animate-pulse">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent animate-scan"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white p-8">
              <Zap className="h-16 w-16 text-fuchsia-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Camera Not Available</h3>
              <p className="text-gray-300 text-center mb-4">
                Camera access is not available. You can still upload an image of your QR code.
              </p>
              
              {/* Upload button for when camera is not available */}
              <label className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors cursor-pointer">
                Upload QR Code Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Instructions and Capture Button */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-center text-white">
            <p className="text-sm text-gray-300 mb-4">
              Position the QR code within the frame to scan
            </p>
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                {hasCamera && (
                  <button
                    onClick={handleManualCapture}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                  >
                    Capture Now
                  </button>
                )}
                
                {/* Image Upload Button */}
                <label className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer text-center">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
             
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;