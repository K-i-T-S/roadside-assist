'use client'

import React, { useState } from 'react'
import { Phone, AlertCircle, CheckCircle2, Loader2, MapPin, Sparkles, Shield, Zap, Navigation, Clock, Star, Car, Battery, Wrench, Fuel, Truck, Gauge, Anchor, Cpu, Hammer, Droplets, Settings, PlugZap, Circle, HelpCircle, Mail } from 'lucide-react'
import { CogIcon, WrenchScrewdriverIcon, TruckIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import { ServiceType, NewRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'
import LocationCollector from '@/components/location/LocationCollector'
import { useLocationCollector } from '@/hooks/useLocationCollector'
import { PhoneModal, LocationModal, AdditionalInfoModal } from '@/components/modals/RequestModals'
const serviceOptions: { type: ServiceType; labelEn: string; labelAr: string; labelArabizi: string; icon: React.ReactNode; description: string; tagline: string }[] = [
  { 
    type: 'tow', 
    labelEn: 'Professional Towing', 
    labelAr: 'قطر احترافي', 
    labelArabizi: 'Bo2trak', 
    icon: <div className="w-30 h-35 bg-white rounded-full p-2 flex items-center justify-center"><img src="/tow.png" alt="Towing" className="w-full h-full object-contain" /></div>, 
    description: 'Professional towing service',
    tagline: 'We move mountains for you'
  },
  { 
    type: 'battery_jump', 
    labelEn: 'Battery Rescue', 
    labelAr: 'إنقاذ بطارية', 
    labelArabizi: '3ewez Tedkeer', 
    icon: <div className="w-30 h-30 bg-white rounded-full p-2 flex items-center justify-center"><img src="/battery.png" alt="Battery" className="w-full h-full object-contain" /></div>, 
    description: 'Jump-start your vehicle',
    tagline: 'Power up your journey'
  },
  { 
    type: 'flat_tire', 
    labelEn: 'Tire Service', 
    labelAr: 'خدمة الإطارات', 
    labelArabizi: 'Mbanshar?', 
    icon: <div className="w-30 h-30 bg-white rounded-full p-2 flex items-center justify-center"><img src="/tire.png" alt="Tire" className="w-full h-full object-contain" /></div>, 
    description: 'Tire change and repair',
    tagline: 'Back on the road'
  },
  { 
    type: 'fuel_delivery', 
    labelEn: 'Fuel Delivery', 
    labelAr: 'توصيل وقود', 
    labelArabizi: 'Ma2tou3 Mnel Benzin', 
    icon: <div className="w-30 h-30 bg-white rounded-full p-2 flex items-center justify-center"><img src="/fuelDelivery.png" alt="Fuel Delivery" className="w-full h-full object-contain" /></div>, 
    description: 'Emergency fuel delivery',
    tagline: 'We bring the fuel to you'
  },
  { 
    type: 'minor_repair', 
    labelEn: 'Quick Fix', 
    labelAr: 'إصلاح سريع', 
    labelArabizi: '3otel Z8ir', 
    icon: <div className="w-45 h-20 bg-white rounded-full p-2 flex items-center justify-center"><img src="/repair.png" alt="Repair" className="w-full h-full object-contain" /></div>, 
    description: 'On-site minor repairs',
    tagline: 'Small problems, big solutions  مشاكل صغيرة، حلول كبيرة'
  },
  { 
    type: 'shi_tene', 
    labelEn: 'Something Else', 
    labelAr: 'شي اخر', 
    labelArabizi: 'Shi Tene', 
    icon: <div className="w-30 h-30 bg-white rounded-full p-2 flex items-center justify-center"><HelpCircle className="w-full h-full text-blue-500" /></div>, 
    description: 'Special service request',
    tagline: 'Whatever you need, we got you'
  },
]

export const dynamic = 'force-dynamic'

export default function Home() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  const [phone, setPhone] = useState('+961 ')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [currentModal, setCurrentModal] = useState<'phone' | 'location' | 'additional' | null>(null)
  const [tempPhone, setTempPhone] = useState('+961 ')
  const [tempPhoneError, setTempPhoneError] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState('')
  
  const {
    locationData,
    locationUrl,
    setLocation,
    clearLocation
  } = useLocationCollector()

  const validatePhone = (phone: string): { isValid: boolean; formatted?: string; errorKey?: string } => {
    const cleaned = phone.replace(/\s/g, '')
    
    if (!cleaned.startsWith('+')) {
      return { isValid: false, errorKey: 'invalidFormat' }
    }
    
    const parts = cleaned.substring(1).split(/(\d{1,4})/).filter(Boolean)
    if (parts.length < 2) {
      return { isValid: false, errorKey: 'invalidCountryCode' }
    }
    
    const countryCode = parts[0]
    const numberPart = parts.slice(1).join('')
    
    if (countryCode === '961') {
      if (numberPart.length !== 8) {
        return { isValid: false, errorKey: 'lebaneseDigits' }
      }
      if (!/^\d{8}$/.test(numberPart)) {
        return { isValid: false, errorKey: 'digitsOnly' }
      }
      const formatted = `+961 ${numberPart.slice(0, 2)} ${numberPart.slice(2, 5)} ${numberPart.slice(5)}`
      return { isValid: true, formatted }
    }
    
    if (numberPart.length < 6 || numberPart.length > 12) {
      return { isValid: false, errorKey: 'otherCountry' }
    }
    if (!/^\d+$/.test(numberPart)) {
      return { isValid: false, errorKey: 'digitsOnly' }
    }
    
    return { isValid: true, formatted: cleaned }
  }

  const handlePhoneChange = (value: string) => {
    let formattedValue = value
    
    if (/^\d+$/.test(value.replace(/\s/g, ''))) {
      const digits = value.replace(/\s/g, '')
      if (digits.length <= 8) {
        formattedValue = `+961 ${digits.slice(0, 2)}${digits.length > 2 ? ' ' : ''}${digits.slice(2, 5)}${digits.length > 5 ? ' ' : ''}${digits.slice(5)}`
      } else {
        formattedValue = `+${digits}`
      }
    } else if (!value.startsWith('+') && value.length > 0) {
      formattedValue = `+${value}`
    }
    
    setPhone(formattedValue)
    
    if (formattedValue.trim() === '+961' || formattedValue.trim() === '+') {
      setPhoneError(null)
    } else {
      const validation = validatePhone(formattedValue)
      if (validation.isValid) {
        setPhone(formattedValue)
        setPhoneError(null)
      } else {
        const errorMessages = {
          invalidFormat: 'Phone must start with + | يجب أن يبدأرق الهاتف بـ +',
          invalidCountryCode: 'Enter valid country code | أدخل رمز بلد صالح',
          lebaneseDigits: '8 digits needed after +961 | 8 أرقام مطلوبة بعد +961',
          digitsOnly: 'Digits only after country code | أرقام فقط بعد رمز البلد',
          otherCountry: '6-12 digits for international | 6-12 رقم للدولي'
        }
        setPhoneError(errorMessages[validation.errorKey as keyof typeof errorMessages] || 'Invalid number | رقم غير صالح')
      }
    }
  }

  const handleTempPhoneChange = (value: string) => {
    let formattedValue = value
    
    if (/^\d+$/.test(value.replace(/\s/g, ''))) {
      const digits = value.replace(/\s/g, '')
      if (digits.length <= 8) {
        formattedValue = `+961 ${digits.slice(0, 2)}${digits.length > 2 ? ' ' : ''}${digits.slice(2, 5)}${digits.length > 5 ? ' ' : ''}${digits.slice(5)}`
      } else {
        formattedValue = `+${digits}`
      }
    } else if (!value.startsWith('+') && value.length > 0) {
      formattedValue = `+${value}`
    }
    
    setTempPhone(formattedValue)
    
    if (formattedValue.trim() === '+961' || formattedValue.trim() === '+') {
      setTempPhoneError(null)
    } else {
      const validation = validatePhone(formattedValue)
      if (validation.isValid) {
        setTempPhone(formattedValue)
        setTempPhoneError(null)
      } else {
        const errorMessages = {
          invalidFormat: 'Phone must start with + | يجب أن يبدأرق الهاتف بـ +',
          invalidCountryCode: 'Enter valid country code | أدخل رمز بلد صالح',
          lebaneseDigits: '8 digits needed after +961 | 8 أرقام مطلوبة بعد +961',
          digitsOnly: 'Digits only after country code | أرقام فقط بعد رمز البلد',
          otherCountry: '6-12 digits for international | 6-12 رقم للدولي'
        }
        setTempPhoneError(errorMessages[validation.errorKey as keyof typeof errorMessages] || 'Invalid number | رقم غير صالح')
      }
    }
  }

  // Modal flow handlers
  const handleServiceSelect = (serviceType: ServiceType) => {
    setSelectedService(serviceType)
    setCurrentModal('phone')
  }

  const handlePhoneNext = (phoneValue: string) => {
    setPhone(phoneValue)
    setCurrentModal('location')
  }

  const handleLocationNext = () => {
    setCurrentModal('additional')
  }

  const handleBackToPhone = () => {
    setCurrentModal('phone')
  }

  const handleBackToLocation = () => {
    setCurrentModal('location')
  }

  const handleCloseModal = () => {
    setCurrentModal(null)
    setTempPhone('+961 ')
    setTempPhoneError(null)
    setTempNotes('')
  }

  const handleModalSubmit = async (notesValue: string) => {
    await handleSubmit(new Event('submit') as any)
  }

  React.useEffect(() => {
    if (error) {
      setTimeout(() => {
        const errorElement = document.getElementById('top-error')
        if (errorElement) {
          errorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!selectedService) {
      setError('Choose your service first | اختر خدمتك أولاً')
      return
    }
    
    const phoneToUse = currentModal ? tempPhone : phone
    const phoneValidation = validatePhone(phoneToUse)
    
    if (!phoneToUse || phoneToUse.trim() === '+961' || phoneToUse.trim() === '+') {
      setError('We need your number to help you | نحتاج رقمك لمساعدتك')
      return
    }
    
    if (!phoneValidation.isValid) {
      const errorMessages = {
        invalidFormat: 'Start with + and country code | ابدأ بـ + ورمز البلد',
        invalidCountryCode: 'Valid country code required | رمز بلد صالح مطلوب',
        lebaneseDigits: '8 digits for Lebanon | 8 أرقام للبنان',
        digitsOnly: 'Numbers only after code | أرقام فقط بعد الرمز',
        otherCountry: '6-12 digits for international | 6-12 رقم للدولي'
      }
      setError(errorMessages[phoneValidation.errorKey as keyof typeof errorMessages] || 'Invalid number | رقم غير صالح')
      return
    }
    
    const formattedPhone = phoneValidation.formatted || phoneToUse
    
    if (!locationData) {
      setError('Share your location so we can find you | شارك موقعنا لنتمكن من إيجادك')
      return
    }
    
    if (!locationUrl) {
      setError('Valid location needed for quick help | موقع صالح مطلوب للمساعدة السريعة')
      return
    }

    setIsSubmitting(true)
    
    try {
      const notesToUse = currentModal ? tempNotes : notes
      const newRequest: NewRequest = {
        service_type: selectedService,
        user_phone: formattedPhone,
        location_link: locationUrl,
        notes: notesToUse || undefined,
      }

      const { error } = await supabase.from('requests').insert(newRequest)
      
      if (error) throw error
      
      setSubmitted(true)
      setCurrentModal(null)
    } catch (error) {
      console.error('Error submitting request:', error)
      setError('Something went wrong. Try again or call us directly. | حدث خطأ. حاول مرة أخرى أو اتصل بنا مباشرةً.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen pattern-lebanese flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center animate-scale-in shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-lg opacity-50 animate-glow"></div>
              <Image 
                src="/kits-logo.png" 
                alt="KiTS Roadside Assistance Logo" 
                className="h-16 w-16 relative"
                width={64}
                height={64}
              />
            </div>
            <div className="text-center mb-6 relative z-10">
              <h2 className="text-blue-800 text-2xl font-bold mb-2 drop-shadow-md">
                KiTS Roadside
              </h2>
              <p className="text-gray-800 text-sm font-medium drop-shadow-sm">
                Your Lebanese Hero | بطلك اللبناني
              </p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 animate-float-smooth">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 animate-slide-up">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
                <span className="text-gradient-modern">Request Received!</span>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-lg text-gray-600 mt-2">We're on our way to help you | راح نكون في طريقنا لمساعدتك</div>
            </h1>
            
            <div className="flex flex-col gap-4">
              <a
                href={`https://wa.me/96181290662?text=Roadside assistance: ${selectedService}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-modern bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-3"
              >
                <Phone className="w-5 h-5" />
                <span>WhatsApp | واتساب</span>
              </a>
              
              <a
                href="tel:+96181290662"
                className="btn-modern bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-3"
              >
                <Phone className="w-5 h-5" />
                <span>Call Now | اتصل الآن</span>
              </a>
              
              <button
                onClick={() => {
                  setSubmitted(false)
                  setSelectedService(null)
                  setPhone('+961 ')
                  setPhoneError(null)
                  clearLocation()
                  setNotes('')
                  setError(null)
                  // Reset modal states
                  setCurrentModal(null)
                  setTempPhone('+961 ')
                  setTempPhoneError(null)
                  setTempNotes('')
                }}
                className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 flex items-center justify-center gap-3"
              >
                <Navigation className="w-5 h-5" />
                <span>New Request | طلب جديد</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen pattern-lebanese">
      {/* Modern Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 text-4xl text-blue-500/20 animate-float-smooth">
            <Car className="w-12 h-12" />
          </div>
          <div className="absolute top-20 right-20 text-4xl text-yellow-500/20 animate-float-smooth animate-delay-100">
            <Zap className="w-10 h-10" />
          </div>
          <div className="absolute bottom-20 left-1/4 text-4xl text-green-500/20 animate-float-smooth animate-delay-200">
            <Wrench className="w-12 h-12" />
          </div>
          <div className="absolute bottom-10 right-1/3 text-4xl text-purple-500/20 animate-float-smooth animate-delay-300">
            <Truck className="w-10 h-10" />
          </div>
          <div className="absolute top-1/2 left-10 text-3xl text-pink-500/10 animate-spin-slow">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute top-1/3 right-10 text-3xl text-orange-500/10 animate-spin-slow animate-delay-300">
            <Star className="w-8 h-8" />
          </div>
        </div>
        
        <div className="relative z-10 text-center px-4 py-0">
          {/* Logo - top right */}
          <div className="absolute top-1 right-0 mx-auto z-20">
            <div className="flex items-center justify-center">
            <Image 
              src="/kits-logo.png" 
              alt="KiTS Roadside Assistance Logo" 
              className="h-12 w-12"
              width={40}
              height={40}
            /></div>
            <div className="mt-1">
              <h3 className="text-blue-800 text-sm font-bold drop-shadow-sm">
                KiTS Roadside
              </h3>
              <p className="text-black bold text-xs drop-shadow-sm">
                Your Lebanese Hero
              </p>
            </div>
          </div>
          
          {/* Broken Car Image - top center */}
          <div className="flex justify-center mb-8 ">
            <div className="relative w-50 h-35 ">
              <Image 
                src="/man-standing-next-broken-down-600nw-2468888759-removebg-preview (2).png"
                alt="Man standing next to broken down car"
                className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center mb-0 mt-10 animate-float-smooth object-contain"
                width={256}
                height={160}
              />
            </div>
          </div>
          {/* Modern Hero Content */}
          <div className="max-w-4xl mx-auto animate-slide-up">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 mb-8 shadow-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-gray-800">Help Available <br></br><span className="font-bold text-xl">24/7</span> Across Lebanon</span>
              <div className="lebanese-flag">🇱🇧</div>
            </div>
            
            {/* Main Headline */}
            <div className="mb-5">
              <h1 className="text-5xl md:text-7xl font-black mb-3 leading-tight">
                <span className="block flex items-center justify-center gap-3 text-6xl md:text-8xl text-orange-500">
                  <span>MA2T<span className="inline-block align-middle" style={{borderRadius: '50%'}}><Image src="/o.png" alt="O" width={85} height={85} className="w-12 h-12 md:w-16 md:h-16 mb-3 rounded-full" style={{objectFit: 'contain'}}/></span>U3?</span>
                </span>
                <div className="text-gradient-modern">
                  <span className="block text-3xl md:text-5xl mt-3 font-bold">مقطوع؟</span>
                  <span className="block text-2xl md:text-3xl mt-3 ">Do you need roadside assistance?</span>
                </div>
              </h1>
              <span className="text-lg text-gray-700">Bkam Kabse Menseer 3endak!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Request Form */}
      <section className="py-0 px-4" id="request-form">
        <div className="max-w-2xl mx-auto">
          <div className="card-modern p-8">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className='mt-0 mb-5'>
                <span className="text-3xl font-bold underline mt-1 mb-3 text-orange-700">Shi 5ateer ?!
                  {/* <br></br> De22 lal Dawle Ya 8aali: */}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 max-w-md mx-auto">
                {/* Red Cross */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                    <img 
                      src="/red-cross-lebanon.png" 
                      alt="Red Cross Lebanon" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href="tel:140"
                    className="btn-modern bg-gradient-to-r from-red-500 to-red-700 text-white px-2 py-3 rounded-full text-xs sm:text-sm font-semibold shadow-lg animate-slide-up flex items-center justify-center hover:scale-105 transition-all w-full h-12 sm:h-13 min-w-0 overflow-hidden"
                  >
                    <span className="text-center leading-normal px-1">140 - RedCross</span>
                  </a>
                </div>
                
                {/* Police */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                    <img 
                      src="/lebanese-police.png" 
                      alt="Lebanese Police" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href="tel:112"
                    className="btn-modern bg-gradient-to-r from-blue-500 to-blue-700 text-white px-2 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg animate-slide-up animate-delay-100 flex items-center justify-center hover:scale-105 transition-all w-full h-11 sm:h-12 min-w-0 overflow-hidden"
                  >
                    <span className="text-center leading-tight px-1">112 - Police</span>
                  </a>
                </div>
                
                {/* Lebanese Army */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                    <img 
                      src="/lebanese-army.png" 
                      alt="Lebanese Army" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href="tel:1701"
                    className="btn-modern bg-gradient-to-r from-green-500 to-green-700 text-white px-2 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg animate-slide-up animate-delay-200 flex items-center justify-center hover:scale-105 transition-all w-full h-11 sm:h-12 min-w-0 overflow-hidden"
                  >
                    <span className="text-center leading-tight px-1">1701 - Army</span>
                  </a>
                </div>
                
                {/* Fire Department */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                    <img 
                      src="/fire-department.png" 
                      alt="Lebanese Fire Department" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href="tel:125"
                    className="btn-modern bg-gradient-to-r from-orange-500 to-orange-700 text-white px-2 py-3 rounded-full text-xs sm:text-sm font-semibold shadow-lg animate-slide-up animate-delay-300 flex items-center justify-center hover:scale-105 transition-all w-full h-12 sm:h-13 min-w-0 overflow-hidden"
                  >
                    <span className="text-center leading-normal px-1">125 - FireDept</span>
                  </a>
                </div>
              </div>
            </div>
            {/* Error Display */}
            {error && (
              <div id="top-error" className="mb-6 p-4 bg-red-50/50 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Service Selection */}
              <fieldset>
                <legend className="block text-lg font-bold text-gray-800 mb-6 text-center">
                  <div>iza laa..</div>
                  <div className="flex items-center justify-center gap-3">
                    <Wrench className="w-8 h-8 text-blue-500" />
                    <span className="text-green-500"><span className="text-blue-500 text-2xl">Shou 3ewez?</span><br></br>How Can We Help?</span>
                    <Car className="w-8 h-8 text-green-500" />
                  </div>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceOptions.map((service) => (
                    <button
                      key={service.type}
                      type="button"
                      onClick={() => handleServiceSelect(service.type)}
                      className={`p-6 rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 card-modern ${
                        selectedService === service.type
                          ? 'border-blue-500 bg-blue-50/20 text-blue-700 scale-105'
                          : currentModal === 'phone' && selectedService === service.type
                          ? 'border-blue-500 bg-blue-50/20 text-blue-700 scale-105'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:scale-105'
                      }`}
                      aria-pressed={selectedService === service.type}
                      aria-describedby={`service-desc-${service.type}`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-blue-500">{service.icon}</div>
                        <div className="text-center">
                          <div className="text-sm text-blue-600 font-small">{service.labelEn}</div>
                          <div className="text-lg font-bold text-gray-900">{service.labelArabizi}</div>
                          <div className="text-sm text-green-600 font-small">{service.labelAr}</div>
                        </div>
                        <div className="text-xs text-gray-500 italic text-center mt-2">{service.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {serviceOptions.map((service) => (
                  <span key={service.type} id={`service-desc-${service.type}`} className="sr-only">
                    {service.description}
                  </span>
                ))}
              </fieldset>

              {/* Skip and Call Immediately Section */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-bold text-red-800">Emergency, Need Help NOW? | طارئ تحتاج مساعدة فوراً؟</h3>
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-700 mb-6">Skip the form and call us directly for immediate assistance <br /> اتصل بنا مباشرة للحصول على مساعدة فورية</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="tel:+96181290662"
                    className="bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg min-w-[180px]"
                  >
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-base">Call Now</span>
                      <span className="text-sm Arabic-text">اتصل الآن</span>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/96181290662"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-green-700 transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg min-w-[180px]"
                  >
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-base">WhatsApp</span>
                      <span className="text-sm Arabic-text">واتساب</span>
                    </div>
                  </a>
                </div>
                <p className="text-sm text-red-600 mt-4">
                  Available 24/7 across Lebanon | متاح 24/7 في جميع أنحاء لبنان
                </p>
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-lg font-bold text-gray-800 mb-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Phone className="w-8 h-8 text-blue-500" />
                    <span>Your Phone | رقم هاتفك</span>
                   
                  </div>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 text-lg transition-all duration-200 card-modern ${
                      phoneError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+961 XX XXX XXX XX"
                    required
                    aria-describedby="phone-help phone-error"
                    aria-invalid={phoneError ? 'true' : 'false'}
                  />
                </div>
                {phoneError && (
                  <p id="phone-error" className="text-sm text-red-600 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </p>
                )}
                <div id="phone-help" className="text-sm text-gray-600 mt-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>+961 for Lebanon</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <LocationCollector
                onLocationChange={setLocation}
                value={locationUrl || undefined}
                error={error || undefined}
                disabled={isSubmitting}
              />

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-lg font-bold text-gray-800 mb-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <QuestionMarkCircleIcon className="w-8 h-8 text-blue-500"></QuestionMarkCircleIcon>
                    <span>Extra Details | تفاصيل إضافية</span>
                    </div>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 text-lg transition-all duration-200 card-modern"
                  placeholder="Tell us more about your issue... | صف لنا المزيد عن مشكلتك..."
                  aria-describedby="notes-help"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!phone || !locationData || isSubmitting}
                className="btn-modern w-full bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold rounded-2xl hover:from-green-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105"
                aria-describedby="submit-help"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Submitting... | جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-6 h-6" />
                    <span>Send Request | أرسل الطلب</span>
                    <Star className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-16" role="contentinfo" id="footer-contact">
        <div className="max-w-6xl mx-auto px-4">
          {/*{/* Emergency Contact Bar 
          <div className="card-modern p-8 mb-8 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <span className="text-red-500">Emergency | طوارئ</span>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="tel:+96181290662" 
                  className="btn-modern bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105 flex items-center gap-3"
                >
                  <Phone className="w-6 h-6" />
                  <span>Call Now | اتصل الآن</span>
                </a>
                <a 
                  href="https://wa.me/+96181290662" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-modern bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition-all hover:scale-105 flex items-center gap-3"
                >
                  <Phone className="w-6 h-6" />
                  <span>WhatsApp | واتساب</span>
                </a>
              </div>
            </div>
          </div>*/}

          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <div className="relative">
                  <div className="absolute -inset-3 lebanese-gradient-subtle rounded-full blur-lg opacity-50 animate-glow"></div>
                  <Image 
                    src="/kits-logo.png" 
                    alt="KiTS Logo" 
                    className="relative h-20"
                    width={80}
                    height={80}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gradient-modern">KiTS Roadside</h3>
                  <p className="text-gray-400 text-sm">Your Lebanese Hero | بطلك اللبناني</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                🇱🇧 Your trusted 24/7 roadside assistance across Lebanon. 
                Fast, reliable, professional service when you need it most. 
              </p>
            </div>

            {/* Contact Info */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
                
                <span>Contact Us | تواصل معنا</span>
                
              </h3>
              <div className="space-y-4">
                <a 
                  href="tel:+96181290662" 
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-semibold text-lg"
                  aria-label="Call us at +961 81 29 06 62"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span>+961 81 29 06 62</span>
                  </div>
                </a>
                <a 
                  href="mailto:kits.tech.co@gmail.com" 
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                  aria-label="Email us at kits.tech.co@gmail.com"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span>kits.tech.co@gmail.com</span>
                  </div>
                </a>
                <a 
                  href="https://wa.me/+96181290662" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-green-400 hover:text-green-300 transition-colors font-semibold text-lg"
                  aria-label="Contact us on WhatsApp"
                >
                  <div className="flex items-center justify-center gap-2">
                   
                    <span>WhatsApp: +961 81 29 06 62</span>
                  </div>
                </a>
                <div className="flex justify-center md:justify-start space-x-4">
                <a 
                  href="https://www.instagram.com/kits_solutions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-modern bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105 flex items-center gap-2"
                >
                 
                  <span>Instagram</span>
                </a>
              </div>
              </div>
            </div>

            {/* Admin Portal & Legal */}
            <div className="text-center md:text-right">
              <h3 className="text-2xl font-bold mb-6 flex items-center justify-center md:justify-end gap-2">
                <Shield className="w-8 h-8 text-purple-400" />
                <span>Admin  | الإدارة</span>
                <Shield className="w-8 h-8 text-purple-400" />
              </h3>
              
              <div className="space-y-3">
                <Link 
                  href="/admin" 
                  className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 text-center inline-block max-w-xs">
                  Admin Portal | الإدارية
                </Link>
                <a 
                  href="https://kitshub.vercel.app/privacy" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <br />
                  <span>Privacy Policy | سياسة الخصوصية</span>
                </a>
                <a 
                  href="https://kitshub.vercel.app/terms" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                 
                  <span>Terms of Service | شروط الخدمة</span>
                </a>
                <a 
                  href="https://kitshub.vercel.app/security" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  
                  <span>Security Policy | سياسة الأمان</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-300 text-sm font-semibold">
              🇱🇧 © 2025 KiTS Hub. All rights reserved. | جميع الحقوق محفوظة 🇱🇧
              <a 
                href="https://kitshub.vercel.app" 
                className="text-blue-400 hover:text-blue-300 transition-colors ml-2 font-bold"
                target="_blank"
                rel="noopener noreferrer"
              >
                🚀 KiTS Hub
              </a>
            </p>
            <p className="text-gray-400 text-xs mt-2">
              ⭐ ISO 9001:2015 Certified | GDPR Compliant | 24/7 Service ⭐
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Components */}
      <PhoneModal
        isOpen={currentModal === 'phone'}
        onClose={handleCloseModal}
        onNext={handlePhoneNext}
        phone={tempPhone}
        phoneError={tempPhoneError}
        onPhoneChange={handleTempPhoneChange}
      />

      <LocationModal
        isOpen={currentModal === 'location'}
        onClose={handleCloseModal}
        onNext={handleLocationNext}
        onBack={handleBackToPhone}
        locationData={locationData}
        locationUrl={locationUrl}
        error={error}
        onLocationChange={setLocation}
        disabled={isSubmitting}
      />

      <AdditionalInfoModal
        isOpen={currentModal === 'additional'}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        onBack={handleBackToLocation}
        notes={tempNotes}
        onNotesChange={setTempNotes}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
