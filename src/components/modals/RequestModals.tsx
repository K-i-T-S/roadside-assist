'use client'

import React from 'react'
import { X, Phone, MapPin, AlertCircle, CheckCircle2, Loader2, Navigation, HelpCircle } from 'lucide-react'
import { ServiceType } from '@/types'
import { LocationData } from '@/hooks/useLocationCollector'
import LocationCollector from '@/components/location/LocationCollector'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  showCallOptions?: boolean
}

export function Modal({ isOpen, onClose, title, children, showCallOptions = true }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Call Options Bar */}
        {showCallOptions && (
          <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800">Need immediate help? | تحتاج مساعدة عاجلة؟</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="tel:+96181290662"
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1 min-w-[80px]"
                >
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>Call</span>
                </a>
                <a
                  href="https://wa.me/96181290662"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1 min-w-[80px]"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-3 h-3 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Body */}
        <div className="px-4 sm:px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface PhoneModalProps {
  isOpen: boolean
  onClose: () => void
  onNext: (phone: string) => void
  phone: string
  phoneError: string | null
  onPhoneChange: (value: string) => void
}

export function PhoneModal({ isOpen, onClose, onNext, phone, phoneError, onPhoneChange }: PhoneModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone && phone.trim() !== '+961' && phone.trim() !== '+' && !phoneError) {
      onNext(phone)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Phone | رقم هاتفك">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600">We need your phone number to reach you | نحتاج رقم هاتفك للتواصل معك</p>
        </div>

        <div>
          <label htmlFor="modal-phone" className="block text-lg font-semibold text-gray-800 mb-3">
            Phone Number | رقم الهاتف
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              id="modal-phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 text-lg transition-all duration-200 ${
                phoneError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+961 XX XXX XXX XX"
              required
              aria-invalid={phoneError ? 'true' : 'false'}
            />
          </div>
          {phoneError && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {phoneError}
            </p>
          )}
          <div className="text-sm text-gray-600 mt-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span>🇱🇧</span>
              <span>+961 for Lebanon</span>
              <span>🇱🇧</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={!phone || phone.trim() === '+961' || phone.trim() === '+' || !!phoneError}
            className="btn-modern w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-base font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] sm:min-w-[140px] transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <span className="text-sm sm:text-base">Continue</span>
            <span className="text-xs sm:text-sm Arabic-text">متابعة</span>
            <Navigation className="w-4 h-4 flex-shrink-0" />
          </button>
          
        </div>
      </form>
    </Modal>
  )
}

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onNext: () => void
  onBack: () => void
  locationData: LocationData | null
  locationUrl: string
  error: string | null
  onLocationChange: (location: LocationData | null) => void
  disabled: boolean
}

export function LocationModal({ isOpen, onClose, onNext, onBack, locationData, locationUrl, error, onLocationChange, disabled }: LocationModalProps) {
  const canProceed = locationData && locationUrl && !error

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Location | موقعك">
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">Share your location so we can find you | شارك موقعنا لنتمكن من إيجادك</p>
        </div>

        <LocationCollector
          onLocationChange={onLocationChange}
          value={locationUrl || undefined}
          error={error || undefined}
          disabled={disabled}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] sm:min-w-[120px]"
            >
              <span className="text-sm sm:text-base">Back</span>
              <span className="text-xs sm:text-sm Arabic-text">رجوع</span>
            </button>
            <button
              onClick={onNext}
              disabled={!canProceed}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-base font-semibold rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] sm:min-w-[140px] transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <span className="text-sm sm:text-base">Continue</span>
              <span className="text-xs sm:text-sm Arabic-text">متابعة</span>
              <Navigation className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
          
        </div>
      </div>
    </Modal>
  )
}

interface AdditionalInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (notes: string) => void
  onBack: () => void
  notes: string
  onNotesChange: (value: string) => void
  isSubmitting: boolean
}

export function AdditionalInfoModal({ isOpen, onClose, onSubmit, onBack, notes, onNotesChange, isSubmitting }: AdditionalInfoModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(notes)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Additional Details | تفاصيل إضافية">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600">Tell us more about your situation (optional) | صف لنا المزيد عن حالتك (اختياري)</p>
        </div>

        <div>
          <label htmlFor="modal-notes" className="block text-lg font-semibold text-gray-800 mb-3">
            Extra Details | تفاصيل إضافية
          </label>
          <textarea
            id="modal-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-gray-900 text-lg transition-all duration-200 resize-none"
            placeholder="Tell us more about your issue... | صف لنا المزيد عن مشكلتك..."
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            Optional - helps us provide better service | اختياري - يساعدنا على تقديم خدمة أفضل
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] sm:min-w-[120px]"
            >
              <span className="text-sm sm:text-base">Back</span>
              <span className="text-xs sm:text-sm Arabic-text">رجوع</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white text-base font-semibold rounded-xl hover:from-green-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-3 min-w-[120px] sm:min-w-[140px] transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                  <span className="text-sm sm:text-base">Submitting...</span>
                  <span className="text-xs sm:text-sm Arabic-text">جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base">Send Request</span>
                  <span className="text-xs sm:text-sm Arabic-text">أرسل الطلب</span>
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>
          </div>
          
        </div>
      </form>
    </Modal>
  )
}
