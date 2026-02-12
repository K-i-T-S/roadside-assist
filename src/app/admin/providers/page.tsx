'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Provider, ServiceType, NewProvider } from '@/types'
import { Phone, MapPin, Plus, Edit2, Trash2, Users, AlertCircle, Search, Filter, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

const serviceTypeOptions: { value: ServiceType; label: string }[] = [
  { value: 'tow', label: 'Tow Truck' },
  { value: 'battery_jump', label: 'Battery Jump' },
  { value: 'flat_tire', label: 'Flat Tire' },
  { value: 'fuel_delivery', label: 'Fuel Delivery' },
  { value: 'minor_repair', label: 'Minor Repair' },
]

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchType, setSearchType] = useState<'all' | 'name' | 'service' | 'area'>('all')
  const [selectedService, setSelectedService] = useState<string>('')
  const [searchArea, setSearchArea] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState<NewProvider>({
    name: '',
    phone: '',
    service_types: [],
    coverage_area: '',
    active: true,
  })

  useEffect(() => {
    checkAuth()
    loadProviders()
  }, [])

  useEffect(() => {
    let filtered = providers
    
    // Apply advanced search filters
    if (searchType === 'name' && searchTerm) {
      filtered = filtered.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    } else if (searchType === 'service' && selectedService) {
      filtered = filtered.filter(provider => 
        provider.service_types.includes(selectedService as ServiceType)
      )
    } else if (searchType === 'area' && searchArea) {
      filtered = filtered.filter(provider => 
        provider.coverage_area.toLowerCase().includes(searchArea.toLowerCase())
      )
    } else if (searchTerm) {
      // Global search across all fields
      filtered = filtered.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.phone.includes(searchTerm) ||
        provider.coverage_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.service_types.some(service => 
          service.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(provider => 
        filterStatus === 'active' ? provider.active : !provider.active
      )
    }
    
    setFilteredProviders(filtered)
  }, [providers, searchTerm, filterStatus, searchType, selectedService, searchArea])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/admin/login')
      return
    }
    setUser(session.user)
  }

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('name')

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (formData.service_types.length === 0) {
      newErrors.service_types = 'At least one service type must be selected'
    }
    
    if (!formData.coverage_area.trim()) {
      newErrors.coverage_area = 'Coverage area is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('providers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('providers')
          .insert(formData)
        
        if (error) throw error
      }

      resetForm()
      loadProviders()
    } catch (error: unknown) {
      console.error('Error saving provider:', error)
      alert((error instanceof Error && error.message) || 'Failed to save provider')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const provider = providers.find(p => p.id === id)
    if (!provider) return
    
    const hasActiveRequests = provider.name // In a real app, you'd check for active requests
    
    if (!confirm(`Are you sure you want to delete ${provider.name}?${hasActiveRequests ? ' This provider may have active requests.' : ''}`)) return
    
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadProviders()
    } catch (error: unknown) {
      console.error('Error deleting provider:', error)
      alert((error instanceof Error && error.message) || 'Failed to delete provider')
    }
  }

  const toggleProviderStatus = async (provider: Provider) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ active: !provider.active })
        .eq('id', provider.id)
      
      if (error) throw error
      
      loadProviders()
    } catch (error) {
      console.error('Error updating provider status:', error)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSelectedService('')
    setSearchArea('')
    setSearchType('all')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      service_types: [],
      coverage_area: '',
      active: true,
    })
    setErrors({})
    setShowAddForm(false)
    setEditingProvider(null)
    setIsSubmitting(false)
  }

  const editProvider = (provider: Provider) => {
    setFormData({
      name: provider.name,
      phone: provider.phone,
      service_types: provider.service_types,
      coverage_area: provider.coverage_area,
      active: provider.active,
    })
    setEditingProvider(provider)
    setShowAddForm(true)
  }

  const handleServiceTypeChange = (serviceType: ServiceType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      service_types: checked 
        ? [...prev.service_types, serviceType]
        : prev.service_types.filter(s => s !== serviceType)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700 text-lg font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-800 font-medium">{user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/admin/login'))}
                className="text-red-700 hover:text-red-800 font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Advanced Search and Filter Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search Type Selector */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Search Type:</label>
                <select
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value as 'all' | 'name' | 'service' | 'area')
                    // Reset other search fields when changing search type
                    setSearchTerm('')
                    setSelectedService('')
                    setSearchArea('')
                  }}
                  className="border border-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium bg-white"
                >
                  <option value="all">All Fields</option>
                  <option value="name">By Name</option>
                  <option value="service">By Service</option>
                  <option value="area">By Area</option>
                </select>
              </div>

              {/* Dynamic Search Fields */}
              {searchType === 'all' && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search all fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-600"
                  />
                  {(searchTerm || selectedService || searchArea) && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      title="Clear search"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {searchType === 'name' && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by provider name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-600"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      title="Clear search"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {searchType === 'service' && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Service:</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="border border-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium bg-white min-w-48"
                  >
                    <option value="">All Services</option>
                    {serviceTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedService && (
                    <button
                      type="button"
                      onClick={() => setSelectedService('')}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Clear service filter"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {searchType === 'area' && (
                <div className="relative flex-1 max-w-md">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by coverage area..."
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-600"
                  />
                  {searchArea && (
                    <button
                      type="button"
                      onClick={() => setSearchArea('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      title="Clear area search"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status Filter and Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-700" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  className="border border-gray-400 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium bg-white"
                >
                  <option value="all">All Providers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add Provider
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Provider Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg mb-6 p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200">
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900 font-semibold text-lg ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-400 bg-white'
                    }`}
                    placeholder="Enter provider name"
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-700 font-semibold flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
                      <AlertCircle className="w-5 h-5" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900 font-semibold text-lg ${
                      errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-400 bg-white'
                    }`}
                    placeholder="Enter phone number"
                    required
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-700 font-semibold flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
                      <AlertCircle className="w-5 h-5" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 mb-3">
                  Service Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {serviceTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.service_types.includes(option.value)}
                        onChange={(e) => handleServiceTypeChange(option.value, e.target.checked)}
                        className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 focus:ring-2 w-5 h-5 checked:bg-blue-600 checked:border-blue-600"
                      />
                      <span className="text-base font-semibold text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.service_types && (
                  <p className="mt-2 text-sm text-red-700 font-semibold flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
                    <AlertCircle className="w-5 h-5" />
                    {errors.service_types}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 mb-3">
                  Coverage Area
                </label>
                <input
                  type="text"
                  value={formData.coverage_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage_area: e.target.value }))}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900 font-semibold text-lg ${
                    errors.coverage_area ? 'border-red-500 bg-red-50' : 'border-gray-400 bg-white'
                  }`}
                  placeholder="Enter coverage area (e.g., Beirut, Mount Lebanon)"
                  required
                />
                {errors.coverage_area && (
                  <p className="mt-2 text-sm text-red-700 font-semibold flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
                    <AlertCircle className="w-5 h-5" />
                    {errors.coverage_area}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-400 text-blue-600 focus:ring-blue-500 focus:ring-2 w-6 h-6"
                />
                <label htmlFor="active" className="text-base font-bold text-gray-800 cursor-pointer">
                  Active Provider
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingProvider ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editingProvider ? 'Update Provider' : 'Add Provider'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="bg-gray-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              All Providers ({filteredProviders.length})
              {filteredProviders.length !== providers.length && (
                <span className="text-base font-normal text-gray-700 ml-2">
                  (filtered from {providers.length} total)
                </span>
              )}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Coverage Area
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-12 h-12 text-gray-600" />
                        <p className="text-gray-700 font-medium">No providers found</p>
                        <p className="text-sm text-gray-600">
                          {searchTerm || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'No providers have been added yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((provider, index) => (
                  <tr key={provider.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {provider.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        {provider.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {provider.service_types.map(service => (
                          <span
                            key={service}
                            className="inline-block px-3 py-1 text-sm bg-blue-200 text-blue-900 font-semibold rounded"
                          >
                            {service.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        {provider.coverage_area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-full ${
                        provider.active 
                          ? 'bg-green-200 text-green-900' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {provider.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProviderStatus(provider)}
                          className={`px-3 py-2 text-sm font-semibold rounded transition-colors ${
                            provider.active
                              ? 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                              : 'bg-green-200 text-green-900 hover:bg-green-300'
                          }`}
                        >
                          {provider.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => editProvider(provider)}
                          className="text-blue-700 hover:text-blue-900 font-medium transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="text-red-700 hover:text-red-900 font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
