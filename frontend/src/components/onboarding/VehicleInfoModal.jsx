import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Users, Phone, MapPin } from 'lucide-react';
import { Card } from '../ui/Card';

export default function VehicleInfoModal({ isOpen, onClose, session, ambulance }) {
  if (!isOpen) return null;

  // Use actual ambulance data from props
  const ambulanceInfo = {
    code: session?.ambulance_code || session?.ambulanceCode || 'N/A',
    registration: ambulance?.registration_number || ambulance?.registrationNumber || 'N/A',
    model: ambulance?.model || 'N/A',
    type: ambulance?.type || 'Basic Life Support',
  };

  // Build crew members array from session data (doctors, paramedics, drivers)
  const crewMembers = [];
  
  // Add doctors
  if (session?.doctors && Array.isArray(session.doctors)) {
    session.doctors.forEach(doc => {
      crewMembers.push({
        id: doc.id,
        name: `${doc.first_name || doc.firstName || ''} ${doc.last_name || doc.lastName || ''}`.trim(),
        role: 'Doctor',
        phone: doc.phone || doc.phone_number || 'N/A'
      });
    });
  }
  
  // Add paramedics
  if (session?.paramedics && Array.isArray(session.paramedics)) {
    session.paramedics.forEach(para => {
      crewMembers.push({
        id: para.id,
        name: `${para.first_name || para.firstName || ''} ${para.last_name || para.lastName || ''}`.trim(),
        role: 'Paramedic',
        phone: para.phone || para.phone_number || 'N/A'
      });
    });
  }
  
  // Add drivers
  if (session?.drivers && Array.isArray(session.drivers)) {
    session.drivers.forEach(driver => {
      crewMembers.push({
        id: driver.id,
        name: `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim(),
        role: 'Driver',
        phone: driver.phone || driver.phone_number || 'N/A'
      });
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
          />
          
          {/* Modal Container - Centered */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-4xl pointer-events-auto"
            >
              <Card className="bg-white dark:bg-gray-900 shadow-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-lg flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Vehicle & Crew Information</h2>
                        <p className="text-sm text-blue-100 mt-0.5">Real-time ambulance details</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                    >
                      <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Vehicle Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Ambulance Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1.5">Ambulance Code</p>
                        <p className="text-lg font-bold text-text">{ambulanceInfo.code}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1.5">Registration Number</p>
                        <p className="text-lg font-bold text-text">{ambulanceInfo.registration}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5">Vehicle Model</p>
                        <p className="text-lg font-bold text-text">{ambulanceInfo.model}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1.5">Type</p>
                        <p className="text-lg font-bold text-text">{ambulanceInfo.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Crew Members */}
                  <div>
                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      Crew Members
                    </h3>
                    {crewMembers.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-base font-medium text-text-secondary">No crew members assigned</p>
                        <p className="text-sm text-text-secondary mt-1">Crew information will appear here when assigned</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {crewMembers.map((member) => (
                          <div
                            key={member.id}
                            className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <span className="text-lg font-bold text-white">
                                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-text truncate">{member.name}</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  member.role === 'Doctor' 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : member.role === 'Paramedic'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                }`}>
                                  {member.role}
                                </span>
                              </div>
                            </div>
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                            >
                              <Phone className="w-4 h-4" />
                              {member.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
