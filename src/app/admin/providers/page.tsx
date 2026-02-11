'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Provider, ServiceType, NewProvider } from '@/types'
import { Phone, MapPin, Plus, Edit2, Trash2, Users } from 'lucide-react'

const serviceTypeOptions: { value: ServiceType; label: string }[] = [
  { value: 'tow', label: 'Tow Truck' },
  { value: 'battery_jump', label: 'Battery Jump' },
  { value: 'flat_tire', label: 'Flat Tire' },
  { value: 'fuel_delivery', label: 'Fuel Delivery' },
  { value: 'minor_repair', label: 'Minor Repair' },
]

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [user, setUser] = useState<any>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('providers')
          .update(formData)
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
    } catch (error) {
      console.error('Error saving provider:', error)
      alert('Failed to save provider')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return
    
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadProviders()
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Failed to delete provider')
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

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      service_types: [],
      coverage_area: '',
      active: true,
    })
    setShowAddForm(false)
    setEditingProvider(null)
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
        <div className="text-gray-500">Loading...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
              <a href="/admin/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Dashboard
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/admin/login'))}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add Provider Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Provider
          </button>
        </div>

        {/* Add/Edit Provider Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                    placeholder="Provider name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                    placeholder="+961 XX XXX XXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {serviceTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.service_types.includes(option.value)}
                        onChange={(e) => handleServiceTypeChange(option.value, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Area
                </label>
                <input
                  type="text"
                  value={formData.coverage_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage_area: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
                  placeholder="e.g., Beirut, Mount Lebanon"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {editingProvider ? 'Update' : 'Add'} Provider
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
            <h2 className="text-lg font-semibold text-gray-900">
              All Providers ({providers.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {provider.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {provider.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {provider.service_types.map(service => (
                          <span
                            key={service}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {service.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {provider.coverage_area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        provider.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provider.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProviderStatus(provider)}
                          className={`px-2 py-1 text-xs rounded ${
                            provider.active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {provider.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => editProvider(provider)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
