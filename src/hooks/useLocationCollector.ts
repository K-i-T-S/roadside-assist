'use client'

import { useState, useCallback } from 'react'

export interface LocationData {
  lat: number
  lng: number
  accuracy?: number
  source: 'manual' | 'geolocation'
}

export interface UseLocationCollectorReturn {
  locationData: LocationData | null
  locationUrl: string
  error: string | null
  isLoading: boolean
  setLocation: (location: LocationData | null) => void
  setLocationUrl: (url: string) => void
  clearLocation: () => void
  generateGoogleMapsUrl: (location: LocationData) => string
  validateLocationUrl: (url: string) => { isValid: boolean; coordinates?: { lat: number; lng: number } }
}

export function useLocationCollector(): UseLocationCollectorReturn {
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [locationUrl, setLocationUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate Google Maps URL from coordinates
  const generateGoogleMapsUrl = useCallback((location: LocationData): string => {
    const zoom = location.accuracy && location.accuracy > 100 ? 15 : 16
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=${zoom}`
  }, [])

  // Validate and parse Google Maps URL
  const validateLocationUrl = useCallback((url: string): { isValid: boolean; coordinates?: { lat: number; lng: number } } => {
    try {
      const urlObj = new URL(url)
      
      // Check if it's a Google Maps URL
      if (!url.includes('maps.google.com') && !url.includes('goo.gl/maps')) {
        return { isValid: false }
      }

      const q = urlObj.searchParams.get('q')
      if (!q) return { isValid: false }
      
      const coords = q.split(',').map(coord => parseFloat(coord.trim()))
      if (coords.length !== 2 || coords.some(isNaN)) return { isValid: false }
      
      const [lat, lng] = coords
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { isValid: false }
      
      return { isValid: true, coordinates: { lat, lng } }
    } catch {
      return { isValid: false }
    }
  }, [])

  // Set location data and update URL
  const setLocation = useCallback((location: LocationData | null) => {
    setLocationData(location)
    setError(null)
    
    if (location) {
      const url = generateGoogleMapsUrl(location)
      setLocationUrl(url)
    } else {
      setLocationUrl('')
    }
  }, [generateGoogleMapsUrl])

  // Set location URL and extract coordinates
  const setLocationUrlWithValidation = useCallback((url: string) => {
    setLocationUrl(url)
    setError(null)

    if (!url.trim()) {
      setLocationData(null)
      return
    }

    const validation = validateLocationUrl(url)
    if (!validation.isValid) {
      setError('Please enter a valid Google Maps link')
      setLocationData(null)
      return
    }

    if (validation.coordinates) {
      const newLocationData: LocationData = {
        lat: validation.coordinates.lat,
        lng: validation.coordinates.lng,
        source: 'manual'
      }
      setLocationData(newLocationData)
    }
  }, [validateLocationUrl])

  // Clear location
  const clearLocation = useCallback(() => {
    setLocationData(null)
    setLocationUrl('')
    setError(null)
  }, [])

  return {
    locationData,
    locationUrl,
    error,
    isLoading,
    setLocation,
    setLocationUrl: setLocationUrlWithValidation,
    clearLocation,
    generateGoogleMapsUrl,
    validateLocationUrl
  }
}
