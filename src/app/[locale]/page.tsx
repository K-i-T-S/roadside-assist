'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, MapPin, Wrench, Battery, Fuel, Car, Plus, AlertCircle, CheckCircle2, Loader2, LocateIcon, Mail } from 'lucide-react'
import { ServiceType, NewRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import LanguageSelector from '@/components/LanguageSelector'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const t = useTranslations()
  
  // Use localStorage for form persistence
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  const [phone, setPhone] = useLocalStorage('roadside_phone', '+961 ')
  const [locationLink, setLocationLink] = useLocalStorage('roadside_location', '')
  const [notes, setNotes] = useLocalStorage('roadside_notes', '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt')
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [showMinimap, setShowMinimap] = useLocalStorage('roadside_show_minimap', true)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState(16)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [mapUrl, setMapUrl] = useState('')
  const [mapProvider, setMapProvider] = useState<'google' | 'osm'>('google')
  const [isClient, setIsClient] = useState(false)

  // Debounce phone validation
  const debouncedPhone = useDebounce(phone, 500)
  
  // Memoize service options to prevent re-renders
  const serviceOptions = useMemo(() => [
    { type: 'tow' as ServiceType, label: t('services.tow.label'), icon: <Car className="w-6 h-6" />, description: t('services.tow.description') },
    { type: 'battery_jump' as ServiceType, label: t('services.battery_jump.label'), icon: <Battery className="w-6 h-6" />, description: t('services.battery_jump.description') },
    { type: 'flat_tire' as ServiceType, label: t('services.flat_tire.label'), icon: <Wrench className="w-6 h-6" />, description: t('services.flat_tire.description') },
    { type: 'fuel_delivery' as ServiceType, label: t('services.fuel_delivery.label'), icon: <Fuel className="w-6 h-6" />, description: t('services.fuel_delivery.description') },
    { type: 'minor_repair' as ServiceType, label: t('services.minor_repair.label'), icon: <Wrench className="w-6 h-6" />, description: t('services.minor_repair.description') },
  ], [t])

  // Memoize validation functions
  const validatePhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^\+\d{1,4}\d{6,12}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }, [])

  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url)
      return url.includes('maps.google.com') || url.includes('goo.gl/maps')
    } catch {
      return false
    }
  }, [])

  const parseGoogleMapsUrl = useCallback((url: string): { lat: number; lng: number; zoom?: number } | null => {
    try {
      const urlObj = new URL(url)
      const q = urlObj.searchParams.get('q')
      if (!q) return null
      
      // Handle coordinates like "33.8938,35.5018" or "33.8938, 35.5018"
      const coords = q.split(',').map(coord => parseFloat(coord.trim()))
      if (coords.length !== 2 || coords.some(isNaN)) return null
      
      const [lat, lng] = coords
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
      
      const zoom = urlObj.searchParams.get('z')
      const zoomLevel = zoom ? parseInt(zoom, 10) : 16
      
      return { lat, lng, zoom: zoomLevel }
    } catch {
      return null
    }
  }, [])

  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt')
      }).catch(() => {
        setLocationPermission('prompt')
      })
    } else {
      setLocationPermission('unsupported')
    }
  }, [])

  // Set isClient to true after mount
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Parse locationLink when it changes
  React.useEffect(() => {
    if (locationLink && validateUrl(locationLink)) {
      const parsed = parseGoogleMapsUrl(locationLink)
      if (parsed) {
        // Check if this URL already matches the current map state to avoid loops
        const currentGoogleUrl = mapCenter 
          ? `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${mapZoom}`
          : null
        
        if (currentGoogleUrl !== locationLink) {
          setMapCenter({ lat: parsed.lat, lng: parsed.lng })
          setMapZoom(parsed.zoom || 16)
          setMapUrl(`https://www.google.com/maps?q=${parsed.lat},${parsed.lng}&z=${parsed.zoom || 16}`)
          setMapProvider('google')
          setIsMapLoading(false)
        }
      }
    }
  }, [locationLink, mapCenter, mapZoom, validateUrl, parseGoogleMapsUrl])

  const getCurrentLocation = async (): Promise<void> => {
    if (!('geolocation' in navigator)) {
      setError(t('location.locationError.notSupported'))
      setLocationPermission('unsupported')
      return
    }

    setIsLocating(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          }
        )
      })

      const { latitude, longitude, accuracy } = position.coords
      setLocationAccuracy(accuracy)
      
      if (accuracy > 100) {
        setError(t('location.locationError.poorAccuracy', { accuracy: Math.round(accuracy) }))
      }
      
      const zoomLevel = accuracy > 1000 ? 15 : accuracy > 100 ? 16 : accuracy > 50 ? 17 : accuracy > 20 ? 18 : 19
      const preciseUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}`
      
      setLocationLink(preciseUrl)
      setLocationPermission('granted')
      setMapCenter({ lat: latitude, lng: longitude })
      setMapZoom(16)
      setMapUrl(`https://www.google.com/maps?q=${latitude},${longitude}&z=16`)
      setMapProvider('google')
      
    } catch (error) {
      console.error('Geolocation error:', error)
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationPermission('denied')
            setError(t('location.locationError.permissionDenied'))
            break
          case error.POSITION_UNAVAILABLE:
            setError(t('location.locationError.unavailable'))
            break
          case error.TIMEOUT:
            setError(t('location.locationError.timeout'))
            break
          default:
            setError(t('location.locationError.unknown'))
        }
      } else {
        setError(t('location.locationError.unknown'))
      }
    } finally {
      setIsLocating(false)
    }
  }

  const toggleMinimap = useCallback((): void => {
    setShowMinimap(!showMinimap)
  }, [showMinimap])

  const updateLocationFromMap = useCallback((lat: number, lng: number, zoom?: number): void => {
    const newZoom = zoom || mapZoom
    const googleUrl = `https://www.google.com/maps?q=${lat},${lng}&z=${newZoom}`
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`
    
    // Update all states atomically
    setLocationLink(googleUrl)
    setMapCenter({ lat, lng })
    setMapZoom(newZoom)
    setMapUrl(mapProvider === 'google' ? googleUrl : osmUrl)
    setLocationAccuracy(20) // Assume reasonable accuracy for manual selection
  }, [mapZoom, mapProvider])

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (!mapCenter) return
    
    // Calculate new coordinates based on click position
    // Different calculation for OSM vs Google Maps
    let newLat: number, newLng: number
    
    if (mapProvider === 'osm') {
      // For OSM, calculate based on current bounding box
      const bboxSize = 0.1 // Current bbox size
      newLat = mapCenter.lat + (0.5 - y / rect.height) * bboxSize
      newLng = mapCenter.lng + (x / rect.width - 0.5) * bboxSize
    } else {
      // For Google Maps (future implementation)
      const latRange = 0.02
      const lngRange = 0.02
      newLat = mapCenter.lat + (0.5 - y / rect.height) * latRange
      newLng = mapCenter.lng + (x / rect.width - 0.5) * lngRange
    }
    
    // Update all states
    updateLocationFromMap(newLat, newLng, mapZoom)
  }, [mapCenter, mapProvider, mapZoom, updateLocationFromMap])

  const handleZoomIn = useCallback((): void => {
    const newZoom = Math.min(20, mapZoom + 1)
    setMapZoom(newZoom)
    if (mapCenter) {
      updateLocationFromMap(mapCenter.lat, mapCenter.lng, newZoom)
    }
  }, [mapZoom, mapCenter, updateLocationFromMap])

  const handleZoomOut = useCallback((): void => {
    const newZoom = Math.max(1, mapZoom - 1)
    setMapZoom(newZoom)
    if (mapCenter) {
      updateLocationFromMap(mapCenter.lat, mapCenter.lng, newZoom)
    }
  }, [mapZoom, mapCenter, updateLocationFromMap])

  const handleResetView = useCallback((): void => {
    setMapZoom(16)
    if (mapCenter) {
      updateLocationFromMap(mapCenter.lat, mapCenter.lng, 16)
    }
  }, [mapCenter, updateLocationFromMap])

  const openLocationInMaps = (): void => {
    if (locationLink) {
      window.open(locationLink, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!selectedService) {
      setError(t('form.fields.service.error'))
      return
    }
    
    if (!phone) {
      setError(t('form.fields.phone.error'))
      return
    }
    
    if (!validatePhone(phone)) {
      setError(t('form.fields.phone.error'))
      return
    }
    
    if (!locationLink) {
      setError(t('form.fields.location.error'))
      return
    }
    
    if (!validateUrl(locationLink)) {
      setError(t('form.fields.location.invalidUrl'))
      return
    }

    setIsSubmitting(true)
    
    try {
      const newRequest: NewRequest = {
        service_type: selectedService,
        user_phone: phone,
        location_link: locationLink,
        notes: notes || undefined,
      }

      const { error } = await supabase.from('requests').insert(newRequest)
      
      if (error) throw error
      
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting request:', error)
      setError(t('errors.submissionFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <Image 
              src="/kits-logo.png" 
              alt="KiTS Roadside Assistance Logo" 
              className="h-16 w-16 mb-4"
              width={64}
              height={64}
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('success.title')}</h1>
          <p className="text-gray-600 mb-8">{t('success.message')}</p>
          
          <div className="space-y-4">
            <a
              href={`https://wa.me/96181290662?text=Roadside assistance request: ${selectedService}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              aria-label={t('success.actions.whatsapp')}
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              {t('success.actions.whatsapp')}
            </a>
            
            <a
              href="tel:+96181290662"
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              aria-label={t('success.actions.call')}
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              {t('success.actions.call')}
            </a>
            
            <button
              onClick={() => {
                setSubmitted(false)
                setSelectedService(null)
                setPhone('+961 ')
                setLocationLink('')
                setNotes('')
                setError(null)
              }}
              className="w-full text-gray-500 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {t('success.actions.newRequest')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col scroll-smooth">
      <div className="fixed top-4 right-4 z-[1000]">
        <LanguageSelector />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl border-b border-blue-800/20 backdrop-blur-lg" role="banner">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-pulse"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-white rounded-lg p-2">
                  <Image 
                    src="/kits-logo.png" 
                    alt="KiTS Roadside Assistance Logo" 
                    className="h-12 w-12 transition-transform duration-300 group-hover:scale-110"
                    width={48}
                    height={48}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-tight">
                  {t('header.brand.title')}
                </h1>
                <p className="text-blue-200 text-sm font-medium tracking-wide">
                  {t('header.brand.tagline')}
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
              <a 
                href="#request-form" 
                className="text-blue-100 hover:text-white font-medium transition-all duration-300 hover:scale-105 relative group text-sm lg:text-base"
              >
                {t('navigation.services')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a 
                href="#footer-contact" 
                className="text-blue-100 hover:text-white font-medium transition-all duration-300 hover:scale-105 relative group text-sm lg:text-base"
              >
                {t('navigation.contact')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <Link 
                href="/admin" 
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:shadow-blue-500/25 text-sm lg:text-base lg:px-4"
              >
                {t('navigation.adminPortal')}
              </Link>
            </nav>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between py-4 border-t border-blue-800/30 gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{t('header.emergency.available247')}</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <a 
                  href="tel:+96181290662" 
                  className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span dir="ltr" className="font-semibold">+961 81 29 06 62</span>
                </a>
                <a 
                  href="https://wa.me/+96181290662" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.06-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="font-semibold">{t('header.emergency.whatsapp')}</span>
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  window.location.href = 'tel:+96181290662'
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:shadow-green-500/25 flex items-center gap-2 text-sm lg:text-base lg:px-6"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('header.emergency.emergencyHelp')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1" role="main">
        {/* Hero Section */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                {t('hero.badge')}
              </div>
              
              <h2 id="hero-title" className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6 leading-tight">
                {t('hero.title.line1')}
                <span className="block text-blue-600">{t('hero.title.line2')}</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-blue-500/25 flex items-center gap-3"
                  aria-label={t('hero.cta.getHelpNow')}
                >
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('hero.cta.getHelpNow')}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                  className="group px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('hero.cta.useMyLocation')}
                >
                  {isLocating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LocateIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {isLocating ? t('hero.cta.gettingLocation') : t('hero.cta.useMyLocation')}
                </button>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 mt-8">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('hero.trustBadges.fastResponse')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('hero.trustBadges.professionalService')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('hero.trustBadges.affordableRates')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <LocateIcon className="w-4 h-4 text-blue-500" />
                  <span>{t('hero.trustBadges.preciseLocation')}</span>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <div className="max-w-2xl mx-auto" id="request-form">
              <div className="bg-white backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-6">{t('form.title')}</h3>
              
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('form.fields.service.label')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {serviceOptions.map((option) => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => setSelectedService(option.type)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedService === option.type
                              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              selectedService === option.type ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {option.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-black">{option.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.fields.phone.label')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('form.fields.phone.placeholder')}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-800 text-black transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.fields.location.label')}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                      <input
                        type="url"
                        id="location"
                        value={locationLink}
                        onChange={(e) => setLocationLink(e.target.value)}
                        className="w-full pl-10 pr-24 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-800 text-black transition-all duration-200"
                        placeholder={t('form.fields.location.placeholder')}
                        required
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        {isClient && locationLink && (
                          <button
                            type="button"
                            onClick={openLocationInMaps}
                            className="p-2 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="View location in maps"
                            title="View location in maps"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                        )}
                        {isClient && locationLink && (
                          <button
                            type="button"
                            onClick={toggleMinimap}
                            className="p-2 bg-white text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            aria-label="Toggle minimap"
                            title="Show minimap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 17.618L6 12l-2-4.618A1 1 0 014.618 6L9 2a1 1 0 011 1v17z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        )}
                        {isClient && locationAccuracy && locationAccuracy > 50 && (
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLocating}
                            className="p-2 bg-white text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            aria-label="Retry for better accuracy"
                            title="Retry for better accuracy"
                          >
                            <LocateIcon className="w-4 h-4" />
                          </button>
                        )}
                        {isClient && (
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLocating || locationPermission === 'denied' || locationPermission === 'unsupported'}
                            className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1"
                            aria-label={isLocating ? 'Getting location...' : 'Get current location'}
                            title={locationPermission === 'denied' ? 'Location access denied' : locationPermission === 'unsupported' ? 'Geolocation not supported' : 'Get current location'}
                          >
                            {isLocating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LocateIcon className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Open Google Maps, share your location, and paste the link here
                      </p>
                      {locationPermission === 'denied' && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Location access denied. Use the button above to enable or enter manually.
                        </p>
                      )}
                      {locationPermission === 'unsupported' && (
                        <p className="text-sm text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Geolocation is not supported in this browser.
                        </p>
                      )}
                      {locationLink && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {locationAccuracy ? (
                            <span>
                              Location captured successfully! 
                              {locationAccuracy <= 10 ? ' (Excellent accuracy)' : 
                               locationAccuracy <= 50 ? ' (Good accuracy)' : 
                               ` (${Math.round(locationAccuracy)}m accuracy)`}
                            </span>
                          ) : (
                            <span>Location captured successfully! Click map icon to view.</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Professional Map Interface */}
                  {isClient && showMinimap && mapCenter && (
                    <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                            <p className="text-sm text-gray-600">Click to set your precise location</p>
                          </div>
                        </div>
                        <button
                          onClick={toggleMinimap}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                          aria-label="Close map"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Hybrid Map Interface */}
                      <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {/* Loading State */}
                        {isMapLoading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm text-gray-600">Loading map...</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Map Provider Toggle */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-1 flex gap-1">
                            <button
                              onClick={() => {
                                setMapProvider('google')
                                if (mapCenter) {
                                  const googleUrl = `https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${mapZoom}`
                                  setMapUrl(googleUrl)
                                  setLocationLink(googleUrl)
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                mapProvider === 'google' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Google Maps
                            </button>
                            <button
                              onClick={() => {
                                setMapProvider('osm')
                                if (mapCenter) {
                                  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.01},${mapCenter.lat - 0.01},${mapCenter.lng + 0.01},${mapCenter.lat + 0.01}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`
                                  setMapUrl(osmUrl)
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                mapProvider === 'osm' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              OpenStreetMap
                            </button>
                          </div>
                        </div>
                        
                        {/* Map iframe */}
                        {mapProvider === 'google' ? (
                          <iframe
                            src={mapUrl}
                            className="w-full h-full border-0"
                            title="Interactive Google Maps"
                            onLoad={() => setIsMapLoading(false)}
                            onError={() => {
                              console.log('Google Maps blocked, switching to OpenStreetMap')
                              setMapProvider('osm')
                              if (mapCenter) {
                                const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05},${mapCenter.lat - 0.05},${mapCenter.lng + 0.05},${mapCenter.lat + 0.05}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`
                                setMapUrl(osmUrl)
                              }
                              setIsMapLoading(false)
                            }}
                          />
                        ) : (
                          <>
                            <iframe
                              src={mapUrl}
                              className="w-full h-full border-0"
                              title="Interactive OpenStreetMap"
                              onLoad={() => setIsMapLoading(false)}
                              onError={() => {
                                console.log('OpenStreetMap failed to load')
                                setIsMapLoading(false)
                              }}
                            />
                            {/* Click Overlay for OSM */}
                            <div 
                              className="absolute inset-0 cursor-crosshair"
                              onClick={handleMapClick}
                              title="Click to set location"
                            >
                              {/* Center Crosshair */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="relative">
                                  {/* Crosshair Lines */}
                                  <div className="absolute w-8 h-px bg-red-600 -left-4 top-1/2 -translate-y-1/2"></div>
                                  <div className="absolute h-8 w-px bg-red-600 -top-4 left-1/2 -translate-x-1/2"></div>
                                  
                                  {/* Center Dot */}
                                  <div className="absolute w-3 h-3 bg-red-600 rounded-full -top-1.5 -left-1.5"></div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Location Info Overlay */}
                        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 min-w-48">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-gray-700">
                                {mapProvider === 'google' ? 'Google Maps' : 'OpenStreetMap'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Latitude:</span>
                                <span className="text-xs font-mono font-semibold text-gray-900">{mapCenter.lat.toFixed(6)}°</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Longitude:</span>
                                <span className="text-xs font-mono font-semibold text-gray-900">{mapCenter.lng.toFixed(6)}°</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Zoom:</span>
                                <span className="text-xs font-mono font-semibold text-gray-900">{mapZoom}x</span>
                              </div>
                              {locationAccuracy && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Accuracy:</span>
                                  <span className="text-xs font-semibold text-blue-600">±{Math.round(locationAccuracy)}m</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Map Controls */}
                        <div className="absolute top-16 right-4 flex flex-col gap-2">
                          <button
                            onClick={handleZoomIn}
                            className="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group hover:bg-blue-50"
                            aria-label="Zoom in"
                            title="Zoom in (+)"
                          >
                            <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={handleZoomOut}
                            className="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group hover:bg-blue-50"
                            aria-label="Zoom out"
                            title="Zoom out (-)"
                          >
                            <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={handleResetView}
                            className="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group hover:bg-blue-50"
                            aria-label="Reset view"
                            title="Reset view (R)"
                          >
                            <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Manual Location Input */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or enter coordinates manually:
                        </label>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              step="0.000001"
                              placeholder="Latitude"
                              value={mapCenter.lat}
                              onChange={(e) => {
                                const lat = parseFloat(e.target.value)
                                if (!isNaN(lat) && lat >= -90 && lat <= 90) {
                                  updateLocationFromMap(lat, mapCenter.lng, mapZoom)
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              step="0.000001"
                              placeholder="Longitude"
                              value={mapCenter.lng}
                              onChange={(e) => {
                                const lng = parseFloat(e.target.value)
                                if (!isNaN(lng) && lng >= -180 && lng <= 180) {
                                  updateLocationFromMap(mapCenter.lat, lng, mapZoom)
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Bar */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Use the map above or enter coordinates manually</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (mapCenter) {
                                openLocationInMaps()
                              }
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open in Google Maps
                          </button>
                          <button
                            onClick={() => {
                              if (mapCenter) {
                                toggleMinimap()
                              }
                            }}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Location
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.fields.notes.label')}
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('form.fields.notes.placeholder')}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-800 text-black transition-all duration-200"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('form.submitting')}
                      </>
                    ) : (
                      t('form.submit')
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer-contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/kits-logo.png" 
                alt="KiTS Roadside Assistance Logo" 
                className="h-12 w-12"
                width={48}
                height={48}
              />
            </div>
            <h3 className="text-xl font-semibold mb-4">{t('footer.contact.title')}</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
              <a
                href="tel:+96181290662"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span dir="ltr">{t('footer.contact.phone')}</span>
              </a>
              <a
                href="https://wa.me/+96181290662"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.06-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span dir="ltr">{t('footer.contact.whatsapp')}</span>
              </a>
              <a
                href="mailto:kits.tech.co@gmail.com"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span dir="ltr">{t('footer.contact.email')}</span>
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
