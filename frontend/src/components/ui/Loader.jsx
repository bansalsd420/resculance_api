import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUiStore from '../../store/uiStore';

export const Loader = () => {
  const { globalLoading, loadingMessage } = useUiStore();

  return (
    <AnimatePresence>
      {globalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
        >
          <div className="bg-white/95 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg min-w-[220px]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-text text-center">
              {loadingMessage || 'Loading...'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
