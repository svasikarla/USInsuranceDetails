import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
};

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-64 w-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <Skeleton className="h-6 w-36 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export const PolicyListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div>
                  <Skeleton className="h-3 w-14 mb-1" />
                  <Skeleton className="h-4 w-18" />
                </div>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const PolicyDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Benefits and Red Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 border border-gray-100 rounded-lg">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <Skeleton className="h-6 w-28 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 border border-red-100 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const DocumentListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rowIndex * 0.05 }}
            className="p-4"
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
