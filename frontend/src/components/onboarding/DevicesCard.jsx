import { MapPin, AlertCircle, Navigation } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export default function DevicesCard({ sosAlerts, type = 'location' }) {
  if (type === 'sos') {
    // SOS Data Card
    return (
      <Card className="p-3 flex flex-col h-full overflow-hidden">
        <h3 className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> SOS
        </h3>
        <p className="text-[10px] text-text-secondary mb-2">System alerts</p>

        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {sosAlerts.map((alert) => (
            <div key={alert.id} className="border border-border rounded p-1.5 hover:bg-background transition-colors">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[9px] text-text">#{alert.id}</span>
                    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                      alert.level === 'Critical' ? 'bg-error/20 text-error' : 
                      alert.level === 'Warning' ? 'bg-warning/20 text-warning' : 
                      'bg-info/20 text-info'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-[9px] text-text-secondary">{alert.time}</span>
                  </div>
                  <p className="text-[10px] text-text truncate">{alert.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Location Card
  return (
    <Card className="p-3 flex flex-col h-full overflow-hidden">
      <h3 className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" /> GPS
      </h3>
      <p className="text-[10px] text-text-secondary mb-2">Device location</p>

      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2 relative min-h-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-text-secondary">
            <Navigation className="w-8 h-8 mx-auto mb-1 opacity-30" />
            <p className="text-[10px]">GPS tracking</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
        <div>
          <p className="text-text-secondary text-[9px] mb-0.5">Speed</p>
          <p className="font-bold text-text">42 km/h</p>
        </div>
        <div>
          <p className="text-text-secondary text-[9px] mb-0.5">Heading</p>
          <p className="font-bold text-text">NE 45°</p>
        </div>
        <div>
          <p className="text-text-secondary text-[9px] mb-0.5">Signal</p>
          <p className="font-bold text-text">4/5</p>
        </div>
      </div>
    </Card>
  );
}
