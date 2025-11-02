import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Maximize2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ambulanceService } from '../../services';
import { useToast } from '../../hooks/useToast';

export const CameraFeedModal = ({ isOpen, onClose, session, ambulance }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);
  const [videoUrls, setVideoUrls] = useState({});
  const [deviceStatus, setDeviceStatus] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && ambulance?.id) {
      fetchDevices();
    }
  }, [isOpen, ambulance]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await ambulanceService.getDevices(ambulance.id);
      const devicesList = response.data?.data || response.data || [];
      
      // Filter for camera devices
      const cameraDevices = devicesList.filter(
        (device) => device.device_type === 'CAMERA' && device.status === 'active'
      );
      
      setDevices(cameraDevices);
      
      // Generate video URLs for 808gps devices
      const urls = {};
      const statuses = {};
      
      cameraDevices.forEach((device) => {
        if (device.device_api && device.device_id) {
          // Check if device has authenticated session
          // For 808gps format: http://205.147.109.152/808gps/open/player/video.html?lang=en&devIdno=100000000001&jsession=xxx
          const baseUrl = device.device_api;
          const deviceId = device.device_id;
          
          // If device has jsession stored, use it; otherwise will need to authenticate
          if (device.jsession) {
            urls[device.id] = `${baseUrl}/808gps/open/player/video.html?lang=en&devIdno=${deviceId}&jsession=${device.jsession}`;
            statuses[device.id] = 'connected';
          } else {
            // Need to authenticate first
            statuses[device.id] = 'needs_auth';
          }
        } else {
          statuses[device.id] = 'not_configured';
        }
      });
      
      setVideoUrls(urls);
      setDeviceStatus(statuses);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      toast.error('Failed to load camera feeds');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticateDevice = async (device) => {
    try {
      // Call backend to authenticate with 808gps API
      const response = await ambulanceService.authenticateDevice(device.id);
      const jsession = response.data?.jsession;
      
      if (jsession) {
        setVideoUrls({
          ...videoUrls,
          [device.id]: `${device.device_api}/808gps/open/player/video.html?lang=en&devIdno=${device.device_id}&jsession=${jsession}`,
        });
        setDeviceStatus({
          ...deviceStatus,
          [device.id]: 'connected',
        });
        toast.success('Camera authenticated successfully');
      }
    } catch (error) {
      console.error('Failed to authenticate device:', error);
      toast.error('Failed to authenticate camera');
      setDeviceStatus({
        ...deviceStatus,
        [device.id]: 'auth_failed',
      });
    }
  };

  const getCameraLabel = (device, index) => {
    if (device.device_name) return device.device_name;
    
    // Default camera names based on index
    const defaultNames = [
      'Patient Bay Camera',
      'Driver View Camera',
      'Equipment Monitor',
      'External View',
    ];
    
    return defaultNames[index] || `Camera ${index + 1}`;
  };

  const getStatusIndicator = (deviceId) => {
    const status = deviceStatus[deviceId];
    
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Live</span>
          </div>
        );
      case 'needs_auth':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-600">Auth Required</span>
          </div>
        );
      case 'not_configured':
        return (
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">Not Configured</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Offline</span>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Camera Feeds
              </h2>
              <p className="text-sm text-secondary mt-1">
                Ambulance: {ambulance?.registration_number || ambulance?.vehicleNumber} • 
                Trip ID: {session?.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                4G • 150ms
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Camera Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No cameras configured</p>
                <p className="text-sm">Add camera devices to this ambulance to view live feeds</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {devices.slice(0, 4).map((device, index) => (
                  <div
                    key={device.id}
                    className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-border"
                  >
                    {/* Camera Header */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {getCameraLabel(device, index)}
                        </h4>
                      </div>
                      {getStatusIndicator(device.id)}
                    </div>

                    {/* Camera Feed */}
                    <div className="relative bg-slate-900 aspect-video">
                      {videoUrls[device.id] ? (
                        <iframe
                          src={videoUrls[device.id]}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="camera; microphone"
                          title={getCameraLabel(device, index)}
                        />
                      ) : deviceStatus[device.id] === 'needs_auth' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <AlertCircle className="w-12 h-12 mb-3 text-amber-500" />
                          <p className="text-sm mb-3">Authentication Required</p>
                          <Button
                            size="sm"
                            onClick={() => handleAuthenticateDevice(device)}
                          >
                            Authenticate Camera
                          </Button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <WifiOff className="w-12 h-12 mb-3 text-gray-500" />
                          <p className="text-sm">Camera Unavailable</p>
                        </div>
                      )}

                      {/* Fullscreen Button */}
                      {videoUrls[device.id] && (
                        <button
                          onClick={() => setActiveCamera(device.id)}
                          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                        >
                          <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Camera Info */}
                    <div className="p-3 bg-white dark:bg-slate-800 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Device ID: {device.device_id}</span>
                        {device.manufacturer && (
                          <span>{device.manufacturer} {device.model}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <div className="text-sm text-secondary">
              Recording: <span className="font-medium text-gray-900 dark:text-white">Active</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchDevices}>
                Refresh Feeds
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
