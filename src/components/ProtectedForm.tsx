'use client'

import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'
import { rateLimiter, generateCSRFToken, validateCSRFToken } from '@/lib/security'

interface ProtectedFormProps {
  children: React.ReactNode
  onSubmit: (data: FormData) => Promise<void>
  className?: string
}

export default function ProtectedForm({ children, onSubmit, className }: ProtectedFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Generate CSRF token on mount
    const token = generateCSRFToken()
    setCsrfToken(token)
    
    // Store in session for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', token)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Check rate limiting
    const clientIP = typeof window !== 'undefined' ? 'client' : 'unknown'
    if (!rateLimiter.isAllowed(clientIP, 5, 15 * 60 * 1000)) {
      setIsRateLimited(true)
      setError('Too many requests. Please try again later.')
      return
    }

    // Validate CSRF token
    const sessionToken = typeof window !== 'undefined' ? 
      sessionStorage.getItem('csrf_token') : null
    
    if (!sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
      setError('Security validation failed. Please refresh the page.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRateLimited) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Rate Limit Exceeded
        </h3>
        <p className="text-yellow-700">
          You&apos;ve made too many requests. Please wait a few minutes before trying again.
        </p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Security Badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/80 backdrop-blur px-2 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          <span>Protected</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Security Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Hidden CSRF Token */}
      <input type="hidden" name="csrf_token" value={csrfToken} />

      {/* Form */}
      <form onSubmit={handleSubmit} className={isSubmitting ? 'opacity-75 pointer-events-none' : ''}>
        {children}
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
