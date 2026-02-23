'use client'

import React, { useState } from 'react'
import { Phone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ServiceType, NewRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'
import LocationCollector from '@/components/location/LocationCollector'
import { useLocationCollector } from '@/hooks/useLocationCollector'

const serviceOptions: { type: ServiceType; labelEn: string; labelAr: string; labelArabizi: string; icon: string; description: string }[] = [
  { type: 'tow', labelEn: 'Tow Truck', labelAr: 'سحب سيارة', labelArabizi: 'Sahb Sayyara', icon: '🚗💨', description: 'Professional towing service' },
  { type: 'battery_jump', labelEn: 'Battery Jump', labelAr: 'تشغيل بطارية', labelArabizi: 'Tashghil Batariya', icon: '🔋⚡', description: 'Jump-start your vehicle' },
  { type: 'flat_tire', labelEn: 'Flat Tire', labelAr: 'تبديل إطار', labelArabizi: 'Tabdil Iwar', icon: '🛞🔧', description: 'Tire change and repair' },
  { type: 'fuel_delivery', labelEn: 'Fuel Delivery', labelAr: 'توصيل بنزين', labelArabizi: 'Tawsil Benzine', icon: '⛽🚚', description: 'Emergency fuel delivery' },
  { type: 'minor_repair', labelEn: 'Minor Repair', labelAr: 'تصليح بسيط', labelArabizi: 'Taslih Basit', icon: '🔧👨‍🔧', description: 'On-site minor repairs' },
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
  
  const {
    locationData,
    locationUrl,
    setLocation,
    clearLocation
  } = useLocationCollector()

  const validatePhone = (phone: string): { isValid: boolean; formatted?: string; errorKey?: string } => {
    const cleaned = phone.replace(/\s/g, '')
    
    // Check if it starts with +
    if (!cleaned.startsWith('+')) {
      return { isValid: false, errorKey: 'invalidFormat' }
    }
    
    // Extract country code and number
    const parts = cleaned.substring(1).split(/(\d{1,4})/).filter(Boolean)
    if (parts.length < 2) {
      return { isValid: false, errorKey: 'invalidCountryCode' }
    }
    
    const countryCode = parts[0]
    const numberPart = parts.slice(1).join('')
    
    // For Lebanon (+961), expect exactly 8 digits
    if (countryCode === '961') {
      if (numberPart.length !== 8) {
        return { isValid: false, errorKey: 'lebaneseDigits' }
      }
      if (!/^\d{8}$/.test(numberPart)) {
        return { isValid: false, errorKey: 'digitsOnly' }
      }
      // Format: +961 81 290 662
      const formatted = `+961 ${numberPart.slice(0, 2)} ${numberPart.slice(2, 5)} ${numberPart.slice(5)}`
      return { isValid: true, formatted }
    }
    
    // For other countries, basic validation
    if (numberPart.length < 6 || numberPart.length > 12) {
      return { isValid: false, errorKey: 'otherCountry' }
    }
    if (!/^\d+$/.test(numberPart)) {
      return { isValid: false, errorKey: 'digitsOnly' }
    }
    
    return { isValid: true, formatted: cleaned }
  }

  const handlePhoneChange = (value: string) => {
    // Allow editing, but smart formatting
    let formattedValue = value
    
    // If user types just digits, assume Lebanese number
    if (/^\d+$/.test(value.replace(/\s/g, ''))) {
      const digits = value.replace(/\s/g, '')
      if (digits.length <= 8) {
        formattedValue = `+961 ${digits.slice(0, 2)}${digits.length > 2 ? ' ' : ''}${digits.slice(2, 5)}${digits.length > 5 ? ' ' : ''}${digits.slice(5)}`
      } else {
        // If more than 8 digits, keep as is but add +
        formattedValue = `+${digits}`
      }
    } else if (!value.startsWith('+') && value.length > 0) {
      // If doesn't start with + and has content, add +
      formattedValue = `+${value}`
    }
    
    setPhone(formattedValue)
    
    // Validate and set error
    if (formattedValue.trim() === '+961' || formattedValue.trim() === '+') {
      setPhoneError(null) // Allow empty or just country code
    } else {
      const validation = validatePhone(formattedValue)
      if (validation.isValid) {
        setPhone(formattedValue)
        setPhoneError(null)
      } else {
        const errorMessages = {
          invalidFormat: 'Phone number must start with + followed by country code | يجب أن يبدأ رقم الهاتف بـ +',
          invalidCountryCode: 'Please enter a valid country code | الرجاء إدخال رمز بلد صالح',
          lebaneseDigits: 'Lebanese numbers need 8 digits after +961 | الأرقام اللبنانية تحتاج 8 أرقام بعد +961',
          digitsOnly: 'Only digits allowed after country code | أرقام فقط بعد رمز البلد',
          otherCountry: 'Invalid international number | رقم دولي غير صالح'
        }
        setPhoneError(errorMessages[validation.errorKey as keyof typeof errorMessages] || 'Invalid phone | رقم هاتف غير صالح')
      }
    }
  }

  // Scroll to error when it appears
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
    
    // Validation
    if (!selectedService) {
      setError('Please select a service type | الرجاء اختيار نوع الخدمة')
      return
    }
    
    if (!phone || phone.trim() === '+961' || phone.trim() === '+') {
      setError('Phone number is required to contact you for roadside assistance | رقم الهاتف مطلول للتواصل معك')
      return
    }
    
    const phoneValidation = validatePhone(phone)
    if (!phoneValidation.isValid) {
      const errorMessages = {
        invalidFormat: 'Phone number must start with + followed by country code | يجب أن يبدأ رقم الهاتف بـ + متبوعًا برمز البلد',
        invalidCountryCode: 'Please enter a valid country code and phone number | الرجاء إدخال رمز بلد ورقم هاتف صالح',
        lebaneseDigits: 'Lebanese phone numbers must have exactly 8 digits after +961 | أرقام الهواتف اللبنانية يجب أن تحتوي على 8 أرقام بعد +961',
        digitsOnly: 'Phone number can only contain digits after the country code | يمكن أن يحتوي رقم الهاتف على أرقام فقط بعد رمز البلد',
        otherCountry: 'International phone numbers must be 6-12 digits after the country code | يجب أن تحتوي الأرقام الدولية على 6-12 رقمًا بعد رمز البلد'
      }
      setError(errorMessages[phoneValidation.errorKey as keyof typeof errorMessages] || 'Invalid phone number | رقم هاتف غير صالح')
      return
    }
    
    // Use the formatted version
    const formattedPhone = phoneValidation.formatted || phone
    
    if (!locationData) {
      setError('Please provide your location | الرجاء توفير موقعك')
      return
    }
    
    if (!locationUrl) {
      setError('Please provide a valid location | الرجاء توفير موقع صالح')
      return
    }

    setIsSubmitting(true)
    
    try {
      const newRequest: NewRequest = {
        service_type: selectedService,
        user_phone: formattedPhone,
        location_link: locationUrl,
        notes: notes || undefined,
      }

      const { error } = await supabase.from('requests').insert(newRequest)
      
      if (error) throw error
      
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting request:', error)
      setError('Failed to submit request. Please try again or contact us directly. | فشل في تقديم الطلب. حاول مرة أخرى أو اتصل بنا مباشرة.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <Image 
                  src="/kits-logo.png" 
                  alt="KiTS Roadside Assistance Logo" 
                  className="h-16 w-16"
                  width={64}
                  height={64}
                />
              </div>
            </div>
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" aria-hidden="true" />
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              <span className="text-4xl">🎉</span>
              <span>Request Submitted! | تم إرسال الطلب! | Tem Irsal El Talab!</span>
              <span className="text-4xl">🎉</span>
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed">
              <span className="text-2xl">✅</span>
              <span>We&apos;ve received your request and will contact you shortly. | لقد تلقينا طلبك وسنتواصل معك قريباً.</span>
              <span className="text-2xl">✅</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <a
              href={`https://wa.me/96181290662?text=Roadside assistance request: ${selectedService}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
              aria-label="Contact us on WhatsApp"
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6" />
              <span>Contact on WhatsApp | تواصل على واتساب</span>
              <img src="/whatsapp.png" alt="WhatsApp" className="w-6 h-6" />
            </a>
            
            <a
              href="tel:+96181290662"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
              aria-label="Call us now"
            >
              <span className="text-2xl">📞</span>
              <span>Call Now | اتصل الآن</span>
              <span className="text-2xl">📞</span>
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
              }}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔄</span>
              <span>Submit Another Request | أرسل طلب آخر</span>
              <span className="text-xl">🔄</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {/* Lebanese-style Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        {/* Animated background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🚗</div>
          <div className="absolute top-20 right-20 text-5xl animate-pulse">⚡</div>
          <div className="absolute bottom-20 left-1/4 text-6xl animate-bounce delay-100">🔧</div>
          <div className="absolute bottom-10 right-1/3 text-5xl animate-pulse delay-200">🛞</div>
          <div className="absolute top-1/2 left-10 text-4xl animate-spin-slow">⭐</div>
          <div className="absolute top-1/3 right-10 text-4xl animate-spin-slow delay-300">🎯</div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          {/* Logo and Brand */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-2xl">
                <Image 
                  src="/kits-logo.png" 
                  alt="KiTS Roadside Assistance Logo" 
                  className="h-20 w-20"
                  width={80}
                  height={80}
                />
              </div>
            </div>
          </div>
          
          {/* Lebanese-style Hero Text */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-lg animate-bounce">
              <span className="text-2xl">🇱🇧</span>
              <span>24/7 Available | متاحين 24/7 | Mawjoudin 24/7</span>
              <span className="text-2xl">🚨</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="block bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent animate-pulse">
                CAR PROBLEM? 🚗💥
              </span>
              <span className="block text-4xl md:text-6xl text-blue-600 mt-2">
                مشكلة بالسيارة؟
              </span>
              <span className="block text-3xl md:text-5xl text-green-600 font-bold mt-2">
                Moshkle bel Sayyara?
              </span>
            </h1>
            
            <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>We Got You! | إحنا معك! | Ehna Maak!</span>
                <span>🎯</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                <span>⚡</span>
                <span>Fast Help Across Lebanon | مساعدة سريعة بكل لبنان</span>
                <span>⚡</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-lg font-bold">
              <div className="bg-white rounded-lg px-4 py-2 shadow-md flex items-center gap-2">
                <span>🏃‍♂️</span>
                <span>Fast Response | استجابة سريعة</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-md flex items-center gap-2">
                <span>👨‍🔧</span>
                <span>Pros | محترفين</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-md flex items-center gap-2">
                <span>💰</span>
                <span>Good Prices | أسعار زينة</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-md flex items-center gap-2">
                <span>📍</span>
                <span>Exact Location | موقع مضبوط</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Section */}
      <section className="py-12 px-4" id="request-form">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-full text-xl font-bold mb-4 shadow-lg">
                <span className="text-2xl">📝</span>
                <span>Get Help Now | اطلب المساعدة الآن | Talab El Mosaada</span>
                <span className="text-2xl">🚀</span>
              </div>
            </div>
              
            {/* Error Display */}
            {error && (
              <div id="top-error" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Service Selection */}
              <fieldset>
                <legend className="block text-lg font-bold text-gray-800 mb-4 text-center">
                  <span className="text-2xl">🔧</span>
                  <span>What service do you need? | شو الخدمة المطلوبة? | Shu El Khidma?</span>
                  <span className="text-2xl">🚗</span>
                </legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceOptions.map((service) => (
                    <button
                      key={service.type}
                      type="button"
                      onClick={() => setSelectedService(service.type)}
                      className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedService === service.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-black'
                      }`}
                      aria-pressed={selectedService === service.type}
                      aria-describedby={`service-desc-${service.type}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span aria-hidden="true">{service.icon}</span>
                        <span className="text-sm font-medium text-black">
                          <div className="text-lg">{service.icon}</div>
                          <div className="text-xs">{service.labelEn}</div>
                          <div className="text-xs text-blue-600">{service.labelAr}</div>
                          <div className="text-xs text-green-600 font-bold">{service.labelArabizi}</div>
                        </span>
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

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-lg font-bold text-gray-800 mb-3 text-center">
                  <span className="text-2xl">📞</span>
                  <span>Phone Number | رقم الهاتف</span>
                  <span className="text-2xl">📞</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-black transition-all duration-200 text-lg ${
                      phoneError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your Lebanese phone number | أدخل رقم الهاتف اللبناني"
                    required
                    aria-describedby="phone-help phone-error"
                    aria-invalid={phoneError ? 'true' : 'false'}
                  />
                </div>
                {phoneError && (
                  <p id="phone-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {phoneError}
                  </p>
                )}
                <p id="phone-help" className="text-sm text-gray-600 mt-1 text-center">
                  <span>💡</span>
                  <span>Starts with +961 for Lebanon. Just type the 8 digits if using Lebanese number. | يبدأ بـ +961 للبنان. فقط اكتب 8 أرقام إذا كنت تستخدم رقم لبناني.</span>
                  <span>💡</span>
                </p>
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
                  <span className="text-2xl">📝</span>
                  <span>Additional Notes | ملاحظات إضافية | Mlahazat Idafiya</span>
                  <span className="text-2xl">✍️</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-black transition-all duration-200 text-lg"
                  placeholder="Describe your issue... | صف مشكلتك... | Sif moshkeltak..."
                  aria-describedby="notes-help"
                />
                <p id="notes-help" className="text-sm text-gray-600 mt-2 text-center">
                  <span>💡</span>
                  <span>Provide any additional details that might help us assist you better | أعطينا تفاصيل إضافية لمساعدتك أفضل</span>
                  <span>💡</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={!phone || !locationData || isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-600 hover:to-blue-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl hover:scale-105"
                aria-describedby="submit-help"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                    <span>Submitting... | جاري الإرسال... | Gari El Irsal...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🚀</span>
                    <span>Submit Request | أرسل الطلب | Arsil El Talab</span>
                    <span className="text-2xl">🎯</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer with Admin Portal */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-12" role="contentinfo" id="footer-contact">
        <div className="max-w-6xl mx-auto px-4">
          {/* Emergency Contact Bar */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 mb-8 text-center shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <span className="text-3xl">🚨</span>
                <span>EMERGENCY | طوارئ | TAWARI</span>
                <span className="text-3xl">🚨</span>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="tel:+96181290662" 
                  className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  <span className="text-xl">📞</span>
                  <span>Call Now | اتصل الآن</span>
                </a>
                <a 
                  href="https://wa.me/+96181290662" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5" />
                  <span>WhatsApp | واتساب</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full blur opacity-50"></div>
                  <Image 
                    src="/kits-logo.png" 
                    alt="KiTS Roadside Assistance Logo" 
                    className="relative h-16 w-auto rounded-full bg-white p-2"
                    width={64}
                    height={64}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">KiTS Roadside</h3>
                  <p className="text-sm text-gray-400">Your Lebanese Hero | بطلك اللبناني</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                🇱🇧 Your trusted partner for 24/7 roadside assistance across Lebanon. 
                Fast, reliable, and professional service when you need it most. 🚗💨
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a 
                  href="https://www.instagram.com/kits_solutions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105 flex items-center gap-2"
                  aria-label="Follow us on Instagram"
                >
                  <span className="text-lg">📷</span>
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl">📞</span>
                <span>Contact Us | تواصل معنا</span>
                <span className="text-2xl">📞</span>
              </h3>
              <div className="space-y-3">
                <a 
                  href="tel:+96181290662" 
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-semibold text-lg"
                  aria-label="Call us at +961 81 29 06 62"
                >
                  📞 +961 81 29 06 62
                </a>
                <a 
                  href="mailto:kits.tech.co@gmail.com" 
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                  aria-label="Email us at kits.tech.co@gmail.com"
                >
                  📧 kits.tech.co@gmail.com
                </a>
                <a 
                  href="https://wa.me/+96181290662" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-green-400 hover:text-green-300 transition-colors font-semibold text-lg"
                  aria-label="Contact us on WhatsApp"
                >
                  <div className="flex items-center gap-2">
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5" />
                    <span>WhatsApp: +961 81 29 06 62</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Admin Portal & Legal */}
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4 flex items-center justify-center md:justify-end gap-2">
                <span className="text-2xl">⚙️</span>
                <span>Admin & Legal | الإدارة والقانونية</span>
                <span className="text-2xl">⚙️</span>
              </h3>
              <div className="space-y-2">
                <Link 
                  href="/admin" 
                  className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 text-center mb-4 shadow-lg"
                >
                  🔐 Admin Portal | البوابة الإدارية
                </Link>
                <a 
                  href="https://kitshub.vercel.app/privacy" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔒 Privacy Policy | سياسة الخصوصية
                </a>
                <a 
                  href="https://kitshub.vercel.app/terms" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📋 Terms of Service | شروط الخدمة
                </a>
                <a 
                  href="https://kitshub.vercel.app/security" 
                  className="block text-gray-400 hover:text-white transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🛡️ Security Policy | سياسة الأمان
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
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
    </div>
  )
}
