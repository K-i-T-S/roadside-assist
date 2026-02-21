'use client'

import React from 'react'

const BrokenCarAnimation = () => {
  return (
    <div className="relative w-32 h-32 animate-float-smooth">
      {/* Car body */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          {/* Main car body */}
          <div className="w-20 h-8 bg-red-600 rounded-lg relative">
            {/* Car roof */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-5 bg-red-700 rounded-t-lg"></div>
            {/* Windows */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-10 h-3 bg-blue-300 rounded-t-sm"></div>
            {/* Wheels */}
            <div className="absolute -bottom-2 left-2 w-3 h-3 bg-gray-800 rounded-full border border-gray-600"></div>
            <div className="absolute -bottom-2 right-2 w-3 h-3 bg-gray-800 rounded-full border border-gray-600"></div>
          </div>
          {/* Engine smoke */}
          <div className="absolute -top-8 left-0">
            <div className="relative">
              <div className="absolute w-4 h-4 bg-gray-400 rounded-full opacity-60 animate-ping"></div>
              <div className="absolute w-6 h-6 bg-gray-300 rounded-full opacity-40 animate-ping animation-delay-200"></div>
              <div className="absolute w-8 h-8 bg-gray-200 rounded-full opacity-20 animate-ping animation-delay-400"></div>
            </div>
          </div>
          {/* More smoke */}
          <div className="absolute -top-6 left-2">
            <div className="relative">
              <div className="absolute w-3 h-3 bg-gray-400 rounded-full opacity-50 animate-ping animation-delay-100"></div>
              <div className="absolute w-5 h-5 bg-gray-300 rounded-full opacity-30 animate-ping animation-delay-300"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Warning triangle */}
      <div className="absolute top-0 right-0 animate-bounce">
        <div className="w-6 h-6 bg-yellow-400 relative">
          <div className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-xs">!</div>
        </div>
      </div>
    </div>
  )
}

export default BrokenCarAnimation
