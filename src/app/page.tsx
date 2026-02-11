'use client'

import { useState } from 'react'
import { Phone, MapPin, Wrench, Battery, Fuel, Car, Plus } from 'lucide-react'
import { ServiceType, NewRequest } from '@/types'
import { supabase } from '@/lib/supabase/client'

const serviceOptions: { type: ServiceType; label: string; icon: React.ReactNode }[] = [
  { type: 'tow', label: 'Tow Truck', icon: <Car className="w-6 h-6" /> },
  { type: 'battery_jump', label: 'Battery Jump', icon: <Battery className="w-6 h-6" /> },
  { type: 'flat_tire', label: 'Flat Tire', icon: <Wrench className="w-6 h-6" /> },
  { type: 'fuel_delivery', label: 'Fuel Delivery', icon: <Fuel className="w-6 h-6" /> },
  { type: 'minor_repair', label: 'Minor Repair', icon: <Wrench className="w-6 h-6" /> },
]

export default function Home() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  const [phone, setPhone] = useState('')
  const [locationLink, setLocationLink] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !phone || !locationLink) return

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
      alert('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Phone className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
          <p className="text-gray-600 mb-8">We've received your request and will contact you shortly.</p>
          
          <div className="space-y-4">
            <a
              href={`https://wa.me/96176123456?text=Roadside assistance request: ${selectedService}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Contact on WhatsApp
            </a>
            
            <a
              href="tel:+96176123456"
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
            
            <button
              onClick={() => {
                setSubmitted(false)
                setSelectedService(null)
                setPhone('')
                setLocationLink('')
                setNotes('')
              }}
              className="w-full text-gray-500 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">RoadsideAssist</h1>
            <a href="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Need Roadside Assistance?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Fast, reliable help when you need it most
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors">
            Need Help Now
          </button>
        </div>

        {/* Request Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Assistance</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What service do you need?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceOptions.map((service) => (
                    <button
                      key={service.type}
                      type="button"
                      onClick={() => setSelectedService(service.type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedService === service.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {service.icon}
                        <span className="text-sm font-medium">{service.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                    placeholder="+961 XX XXX XXX"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Google Maps Link)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    id="location"
                    value={locationLink}
                    onChange={(e) => setLocationLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                    placeholder="https://maps.google.com/..."
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Open Google Maps, share your location, and paste the link here
                </p>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                  placeholder="Describe your issue..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedService || !phone || !locationLink || isSubmitting}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Available 24/7 for roadside assistance in Lebanon
          </p>
          <div className="mt-4 space-y-2">
            <a href="tel:+96176123456" className="block text-blue-400 hover:text-blue-300">
              📞 +961 76 123 456
            </a>
            <a 
              href="https://wa.me/96176123456" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-green-400 hover:text-green-300"
            >
              💬 WhatsApp: +961 76 123 456
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
