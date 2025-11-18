import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Maximize2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ambulanceService } from '../../services';
import cameraService from '../../services/cameraService';
import { useToast } from '../../hooks/useToast';

export const CameraFeedModal = ({ isOpen, onClose, session, ambulance }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
    return undefined;
  }, [isOpen]);
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
      
      // Generate video URLs using new 808GPS authentication flow
      const urls = {};
      const statuses = {};
      
      for (const device of cameraDevices) {
        try {
          // Check if device has required credentials
          if (!device.device_id || !device.device_username || !device.device_password) {
            statuses[device.id] = 'not_configured';
            continue;
          }

          // Get authenticated stream URL using camera service
          const streamUrl = await cameraService.getCameraStreamUrl({
            id: device.id, // Database ID
            deviceId: device.device_id,
            username: device.device_username,
            password: device.device_password,
          });

          urls[device.id] = streamUrl;
          statuses[device.id] = 'connected';
        } catch (error) {
          console.error(`Failed to get stream for device ${device.id}:`, error);
          statuses[device.id] = 'auth_failed';
        }
      }
      
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

  // Normalize stream URL by removing any existing channel/chns params
  const normalizeStreamUrl = (url) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete('channel');
      parsed.searchParams.delete('chns');
      return parsed.toString();
    } catch (e) {
      return url.replace(/[?&](?:channel|chns)=[^&]*/g, '').replace(/\?&/, '?').replace(/[?&]$/, '');
    }
  };

  const handleAuthenticateDevice = async (device) => {
    try {
      if (!device.device_id || !device.device_username || !device.device_password) {
        toast.error('Device credentials not configured');
        return;
      }

      // Get authenticated stream URL using camera service
      const streamUrl = await cameraService.getCameraStreamUrl({
        id: device.id, // Database ID
        deviceId: device.device_id,
        username: device.device_username,
        password: device.device_password,
      });

      setVideoUrls({
        ...videoUrls,
        [device.id]: streamUrl,
      });
      setDeviceStatus({
        ...deviceStatus,
        [device.id]: 'connected',
      });
      toast.success('Camera authenticated successfully');
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
      case 'auth_failed':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">Auth Failed</span>
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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-auto"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {devices.length === 1 && videoUrls[devices[0].id] ? (
                  // Single camera device: expose 4 channel outputs (chns=0..3)
                  Array.from({ length: 4 }).map((_, chIndex) => {
                    const device = devices[0];
                    const normalized = normalizeStreamUrl(videoUrls[device.id]);
                    const src = normalized ? `${normalized}${normalized.includes('?') ? '&' : '?'}channel=1&chns=${chIndex}` : '';
                    return (
                      <div key={`${device.id}-${chIndex}`} className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-border flex flex-col">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getCameraLabel(device, chIndex)}
                            </h4>
                          </div>
                          {getStatusIndicator(device.id)}
                        </div>

                        <div className="relative bg-slate-900 aspect-video overflow-hidden">
                          {src ? (
                            <iframe
                              src={src}
                              className="w-full h-full block"
                              frameBorder="0"
                              scrolling="no"
                              allow="camera; microphone; autoplay; fullscreen"
                              allowFullScreen
                              title={getCameraLabel(device, chIndex)}
                              style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                              <WifiOff className="w-12 h-12 mb-3 text-gray-500" />
                              <p className="text-sm">Channel Unavailable</p>
                            </div>
                          )}

                          {src && (
                            <button
                              onClick={() => setActiveCamera(`${device.id}-${chIndex}`)}
                              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                            >
                              <Maximize2 className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-between">
                            <span>Device ID: {device.device_id}</span>
                            {device.manufacturer && (
                              <span>{device.manufacturer} {device.model}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  devices.slice(0, 4).map((device, index) => (
                    <div key={device.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-border flex flex-col">
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
                      <div className="relative bg-slate-900 aspect-video overflow-hidden">
                        {videoUrls[device.id] ? (
                          (() => {
                            const normalized = normalizeStreamUrl(videoUrls[device.id]);
                            const src = normalized ? `${normalized}${normalized.includes('?') ? '&' : '?'}channel=1&chns=${index}` : '';
                            return (
                              <iframe
                                src={src}
                                className="w-full h-full block"
                                frameBorder="0"
                                scrolling="no"
                                allow="camera; microphone; autoplay; fullscreen"
                                allowFullScreen
                                title={getCameraLabel(device, index)}
                                style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                              />
                            );
                          })()
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
                  ))
                )}
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
