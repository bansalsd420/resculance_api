import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { ambulanceService } from '../services';
import cameraService from '../services/cameraService';
import { useToast } from '../hooks/useToast';

/**
 * LiveCameraFeed Component
 * Displays 808GPS camera player from ambulance device API
 */
export const LiveCameraFeed = ({ ambulance, session, onCameraClick }) => {
  const [cameraUrl, setCameraUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraDevice, setCameraDevice] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (ambulance?.id) {
      fetchAndAuthenticateCamera();
    } else {
      setError('No ambulance data available');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambulance?.id]);

  const fetchAndAuthenticateCamera = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching camera devices for ambulance:', ambulance.id);

      // Fetch devices from backend
      const response = await ambulanceService.getDevices(ambulance.id);
      const devices = response.data?.data || response.data || [];

      console.log('Devices fetched:', devices);

      // Find active camera device
      const camera = devices.find(
        (device) => device.device_type === 'CAMERA' && device.status === 'active'
      );

      if (!camera) {
        setError('No active camera found for this ambulance');
        setLoading(false);
        return;
      }

      console.log('Camera device found:', camera);
      setCameraDevice(camera);

      // Check if device has required credentials
      if (!camera.device_id || !camera.device_username || !camera.device_password) {
        setError('Camera device missing credentials');
        setLoading(false);
        return;
      }

      console.log('Authenticating camera:', camera.device_id);

      // Authenticate and get stream URL
      const streamUrl = await cameraService.getCameraStreamUrl({
        deviceId: camera.device_id,
        username: camera.device_username,
        password: camera.device_password,
      });

      console.log('Camera authenticated successfully!');
      console.log('Stream URL:', streamUrl);

      setCameraUrl(streamUrl);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load camera:', err);
      setError(`Failed to load camera: ${err.message}`);
      setLoading(false);
      toast.error('Failed to load camera feed');
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading Camera Feed...</p>
          <p className="text-gray-400 text-sm mt-2">Authenticating with 808GPS</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center px-6">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <p className="text-white text-lg font-medium mb-2">Camera Unavailable</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAndAuthenticateCamera}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
      onClick={() => onCameraClick && onCameraClick(cameraDevice)}
    >
      {/* Live indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-error/90 px-3 py-1.5 rounded-md backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-white text-sm font-bold">LIVE</span>
      </div>

      {/* Camera name */}
      {cameraDevice && (
        <div className="absolute bottom-4 left-4 z-20 bg-black/70 px-3 py-1.5 rounded-md backdrop-blur-sm">
          <span className="text-white text-sm font-medium">{cameraDevice.device_name}</span>
        </div>
      )}

      {/* Click to enlarge hint */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
        <div className="text-center">
          <Camera className="w-12 h-12 text-white mx-auto mb-2" />
          <p className="text-white text-lg font-medium">Click to enlarge</p>
        </div>
      </div>

      {/* Full screen camera feed */}
      <iframe
        src={cameraUrl}
        className="w-full h-full min-h-[400px]"
        frameBorder="0"
        allow="camera; microphone; autoplay; fullscreen"
        title="808GPS Live Camera Feed"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default LiveCameraFeed;
