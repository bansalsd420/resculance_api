import { useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import LiveCameraFeed from '../LiveCameraFeed';

export default function CameraCard({
  session,
  ambulance,
  isActive,
  onCameraClick,
  onRefresh,
}) {
  const [activeDevice, setActiveDevice] = useState(null);

  // Mock camera devices
  const cameraDevices = ambulance?.devices?.filter(d => d.type === 'camera') || [
    { id: 'cam1', name: 'Cabin Camera', status: 'active' },
    { id: 'cam2', name: 'Patient Camera', status: 'active' },
    { id: 'cam3', name: 'Exterior Camera', status: 'inactive' },
  ];

  return (
    <Card className="p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <Camera className="w-4 h-4" /> Live Camera Feed
        </h3>
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Camera Feed */}
      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden mb-2 min-h-0">
        {isActive && session ? (
          <LiveCameraFeed 
            sessionId={session.id} 
            deviceId={activeDevice || cameraDevices[0]?.id}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active session</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Selection */}
      <div className="space-y-1 flex-shrink-0">
        <p className="text-xs font-medium text-text-secondary mb-1">Available Cameras</p>
        <div className="grid grid-cols-3 gap-1">
          {cameraDevices.map((device) => (
            <button
              key={device.id}
              onClick={() => {
                setActiveDevice(device.id);
                onCameraClick(device);
              }}
              disabled={device.status !== 'active'}
              className={`p-1.5 rounded text-[9px] font-medium transition-colors ${
                activeDevice === device.id || (!activeDevice && device === cameraDevices[0])
                  ? 'bg-primary text-white'
                  : device.status === 'active'
                  ? 'bg-gray-100 dark:bg-gray-800 text-text hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 text-text-secondary cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  device.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="truncate">{device.name.split(' ')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
