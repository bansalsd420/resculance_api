import { motion } from 'framer-motion';
import { Power, Lightbulb, Volume2, Wind, Heart, Camera } from 'lucide-react';
import { Card } from '../ui/Card';

export default function ControlsCard({ controls, onToggleControl, horizontal = false }) {
  const controlItems = [
    { key: 'mainPower', icon: Power, label: 'Main Power', color: 'blue', activeColor: 'bg-blue-500', glowColor: 'shadow-blue-500/50' },
    { key: 'emergencyLights', icon: Lightbulb, label: 'Emergency', color: 'amber', activeColor: 'bg-amber-500', glowColor: 'shadow-amber-500/50' },
    { key: 'siren', icon: Volume2, label: 'Siren', color: 'red', activeColor: 'bg-red-500', glowColor: 'shadow-red-500/50' },
    { key: 'airConditioning', icon: Wind, label: 'Air Con', color: 'cyan', activeColor: 'bg-cyan-500', glowColor: 'shadow-cyan-500/50' },
    { key: 'oxygenSupply', icon: Heart, label: 'Oxygen', color: 'green', activeColor: 'bg-green-500', glowColor: 'shadow-green-500/50' },
    { key: 'cabinCamera', icon: Camera, label: 'Camera', color: 'purple', activeColor: 'bg-purple-500', glowColor: 'shadow-purple-500/50' },
  ];

  if (horizontal) {
    return (
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 pointer-events-auto">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-lg border border-border p-3 flex items-center gap-3 overflow-hidden">
            {controlItems.map(({ key, icon: Icon, label, activeColor, glowColor }) => {
              const isActive = controls[key];
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onToggleControl(key)}
                  className={`flex-1 flex items-center justify-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 text-center ${
                    isActive
                      ? `${activeColor} shadow-lg ${glowColor} text-white`
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text'
                  }`}
                >
                  <div className={`p-2 rounded-md ${isActive ? 'bg-white/10' : 'bg-transparent'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <div className="text-sm font-semibold">{label}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3 flex flex-col h-full overflow-hidden">
      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <Power className="w-4 h-4" /> Ambulance Controls
      </h3>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {controlItems.map(({ key, icon: Icon, label, activeColor, glowColor }) => {
          const isActive = controls[key];
          
          return (
            <motion.button 
              key={key} 
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onToggleControl(key)} 
              className={`relative p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? `${activeColor} shadow-lg ${glowColor}` 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-full transition-all ${
                  isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <p className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-text'
                }`}>
                  {label}
                </p>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}
