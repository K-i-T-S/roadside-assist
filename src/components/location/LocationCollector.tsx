'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { MapPin, LocateIcon, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface LocationData {
  lat: number
  lng: number
  accuracy?: number
  source: 'manual' | 'geolocation'
}

interface LocationCollectorProps {
  onLocationChange: (location: LocationData | null) => void
  value?: string
  error?: string
  disabled?: boolean
}

export default function LocationCollector({ onLocationChange, value, error, disabled }: LocationCollectorProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Fix hydration issues
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Parse Google Maps URL to extract coordinates
  const parseGoogleMapsUrl = useCallback((url: string): { lat: number; lng: number } | null => {
    try {
      const urlObj = new URL(url)
      const q = urlObj.searchParams.get('q')
      if (!q) return null
      
      const coords = q.split(',').map(coord => parseFloat(coord.trim()))
      if (coords.length !== 2 || coords.some(isNaN)) return null
      
      const [lat, lng] = coords
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
      
      return { lat, lng }
    } catch {
      return null
    }
  }, [])

  // Validate Google Maps URL
  const isValidGoogleMapsUrl = useCallback((url: string): boolean => {
    try {
      new URL(url)
      return url.includes('maps.google.com') || url.includes('goo.gl/maps')
    } catch {
      return false
    }
  }, [])

  // Handle manual URL input
  const handleUrlChange = useCallback((url: string) => {
    setLocationError(null)
    
    if (!url.trim()) {
      setLocationData(null)
      onLocationChange(null)
      setShowPreview(false)
      return
    }

    if (!isValidGoogleMapsUrl(url)) {
      setLocationError('Please provide a valid Google Maps link | الرجاء توفير رابط خرائط جوجل صالح')
      onLocationChange(null)
      return
    }

    const coords = parseGoogleMapsUrl(url)
    if (!coords) {
      setLocationError('Please provide a valid Google Maps link | الرجاء توفير رابط خرائط جوجل صالح')
      onLocationChange(null)
      return
    }

    const newLocationData: LocationData = {
      lat: coords.lat,
      lng: coords.lng,
      source: 'manual'
    }

    setLocationData(newLocationData)
    onLocationChange(newLocationData)
    setShowPreview(true)
  }, [isValidGoogleMapsUrl, parseGoogleMapsUrl, onLocationChange])

  // Get current location with improved UX
  const getCurrentLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser. Please enter your location manually. | الموقع الجغرافي غير مدعوم في متصفحك. الرجاء إدخال موقعك يدويًا.')
      return
    }

    // Show context before requesting permission
    const shouldProceed = window.confirm(
      'We need your location to provide faster roadside assistance. Your location will only be used for this request. Continue? | نحتاج إلى موقعك لتقديم مساعدة أسرع على جانب الطريق. سيتم استخدام موقعك لهذا الطلب فقط. متابعة؟'
    )

    if (!shouldProceed) return

    setIsLocating(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000, // 5 minutes cache
          }
        )
      })

      const { latitude, longitude, accuracy } = position.coords
      const googleMapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16`

      const newLocationData: LocationData = {
        lat: latitude,
        lng: longitude,
        accuracy,
        source: 'geolocation'
      }

      setLocationData(newLocationData)
      onLocationChange(newLocationData)
      setShowPreview(true)

      // Update the input field with the generated URL
      const input = document.getElementById('location-url') as HTMLInputElement
      if (input) {
        input.value = googleMapsUrl
      }

    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please enable location services in your browser settings or enter your location manually. | تم رفض الوصول إلى الموقع. الرجاء تمكين خدمات الموقع في إعدادات المتصفح أو إدخال موقعك يدويًا.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable. This might be due to poor GPS signal or network issues. Please try again when outdoors or enter your location manually. | معلومات الموقع غير متوفرة. قد يكون هذا بسبب ضعف إشارة GPS أو مشاكل في الشبكة. حاول مرة أخرى عندما تكون في الخارج أو أدخل موقعك يدويًا.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please check your internet connection and try again, or enter your location manually. | انتهت مهلة طلب الموقع. الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى ، أو إدخال موقعك يدويًا.')
            break
          default:
            setLocationError('Unable to retrieve your location. Please enter your location manually or try again. | غير قادر على استرداد موقعك. الرجاء إدخال موقعك يدويًا أو المحاولة مرة أخرى.')
        }
      } else if (error instanceof Error) {
        if (error.message.includes('Permissions policy')) {
          setLocationError('Location access is blocked by browser security settings. Please enter your location manually. | الوصول إلى الموقع محظور بواسطة إعدادات أمان المتصفح. الرجاء إدخال موقعك يدويًا.')
        } else {
          setLocationError('Unable to retrieve your location. Please enter your location manually or try again. | غير قادر على استرداد موقعك. الرجاء إدخال موقعك يدويًا أو المحاولة مرة أخرى.')
        }
      } else {
        setLocationError('Unable to retrieve your location. Please enter your location manually or try again. | غير قادر على استرداد موقعك. الرجاء إدخال موقعك يدويًا أو المحاولة مرة أخرى.')
      }
    } finally {
      setIsLocating(false)
    }
  }, [onLocationChange])

  // Generate map preview URL
  const getMapPreviewUrl = useCallback(() => {
    if (!locationData) return ''
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${locationData.lng - 0.01},${locationData.lat - 0.01},${locationData.lng + 0.01},${locationData.lat + 0.01}&layer=mapnik&marker=${locationData.lat},${locationData.lng}`
  }, [locationData])

  // Open location in Google Maps
  const openInMaps = useCallback(() => {
    if (!locationData) return
    window.open(`https://maps.google.com/maps?q=${locationData.lat},${locationData.lng}`, '_blank')
  }, [locationData])

  return (
    <div className="space-y-4">
      {/* Main Location Input */}
      <div>
        <label htmlFor="location-url" className="block text-lg font-bold text-gray-800 mb-3 text-center">
          <span className="text-2xl">📍</span>
          <span>Location | الموقع</span>
          
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="location-url"
            type="url"
            defaultValue={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Share your Google Maps location link | شارك رابط موقع خرائط جوجل"
            className={`w-full pl-10 pr-24 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-black transition-all duration-200 ${
              error || locationError ? 'border-red-300' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
            disabled={disabled}
            aria-describedby="location-help location-error"
            aria-invalid={!!error || !!locationError}
          />
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {locationData && (
              <button
                type="button"
                onClick={openInMaps}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Open in Maps | افتح في الخرائط"
                title="Open in Maps | افتح في الخرائط"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocating || disabled}
              className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
              aria-label={isLocating ? 'Getting location... | جاري تحديد الموقع...' : 'Use my location | استخدم موقعي'}
              title="Use my location | استخدم موقعي"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p id="location-help" className="text-sm text-gray-600 mt-2 text-center">
          <span>💡</span>
          <span>Share your location from Google Maps or use your current location | شارك موقعك من خرائط جوجل أو استخدم موقعك الحالي</span>
          <span>💡</span>
        </p>

        {/* Error Messages */}
        {(error || locationError) && (
          <p id="location-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error || locationError}
          </p>
        )}

        {/* Success Message */}
        {locationData && !error && !locationError && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Location detected successfully | تم تحديد الموقع بنجاح</span>
            {locationData.accuracy && isHydrated && (
              <span className="text-xs">
                (±{Math.round(locationData.accuracy)}m accuracy)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Location Preview */}
      {showPreview && locationData && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Location Preview | معاينة الموقع</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close | إغلاق"
                title="Close | إغلاق"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="relative h-48 bg-gray-100">
            <iframe
              src={getMapPreviewUrl()}
              className="w-full h-full border-0"
              title="Location preview"
              loading="lazy"
            />
            
            {/* Location Info Overlay */}
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Lat:</span>
                  <span className="font-mono font-semibold">{locationData.lat.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Lng:</span>
                  <span className="font-mono font-semibold">{locationData.lng.toFixed(6)}</span>
                </div>
                {locationData.accuracy && isHydrated && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-semibold text-blue-600">±{Math.round(locationData.accuracy)}m</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
