import React from 'react';

const Pulse = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-8 w-16" />
        <Pulse className="h-2 w-20" />
      </div>
      <Pulse className="h-12 w-12 rounded-xl" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <Pulse className="h-10 w-full rounded-lg" />
    </div>
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3"><Pulse className="h-3 w-16" /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-b border-gray-100">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="px-4 py-3"><Pulse className={`h-3 ${c === 0 ? 'w-20' : 'w-16'}`} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonCards = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-16 rounded-full" />
            </div>
            <Pulse className="h-3 w-3/4" />
            <div className="flex space-x-4">
              <Pulse className="h-2 w-16" />
              <Pulse className="h-2 w-20" />
              <Pulse className="h-2 w-16" />
            </div>
          </div>
          <Pulse className="h-7 w-20 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <Pulse className="h-5 w-40" />
        <Pulse className="h-48 w-full rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <Pulse className="h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Pulse className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Pulse;
