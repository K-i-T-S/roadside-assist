'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Request, Provider, RequestStatus } from '@/types'
import { Phone, MapPin, Clock, CheckCircle, AlertCircle, Users, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/admin/login')
      return
    }
    setUser(session.user)
  }

  const loadData = async () => {
    try {
      const [requestsRes, providersRes] = await Promise.all([
        supabase
          .from('requests')
          .select(`
            *,
            provider:providers(*)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('providers')
          .select('*')
          .order('name')
      ])

      if (requestsRes.data) setRequests(requestsRes.data)
      if (providersRes.data) setProviders(providersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: RequestStatus, providerId?: string) => {
    try {
      const updateData: { status: RequestStatus; provider_id?: string } = { status }
      if (providerId) updateData.provider_id = providerId

      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to update request')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-200 text-yellow-900 font-semibold'
      case 'assigned': return 'bg-blue-200 text-blue-900 font-semibold'
      case 'completed': return 'bg-green-200 text-green-900 font-semibold'
      default: return 'bg-gray-200 text-gray-900 font-semibold'
    }
  }

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'assigned': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const todayRequests = requests.filter(r => 
    new Date(r.created_at).toDateString() === new Date().toDateString()
  )

  const completedToday = todayRequests.filter(r => r.status === 'completed').length
  const activeProviders = providers.filter(p => p.active).length

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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-800 font-medium">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-red-700 hover:text-red-800 font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Links */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            href="/admin/providers"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <Users className="w-5 h-5" />
            Manage Service Providers
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-700">Today&apos;s Requests</p>
                <p className="text-2xl font-bold text-gray-900">{todayRequests.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-700">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-700">Active Providers</p>
                <p className="text-2xl font-bold text-gray-900">{activeProviders}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-700">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.service_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        {request.user_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <a
                        href={request.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        View Location
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.provider?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateRequestStatus(request.id, 'assigned', e.target.value)
                                }
                              }}
                              className="text-sm border-gray-400 border rounded px-3 py-2 font-medium bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              defaultValue=""
                            >
                              <option value="" disabled className="text-gray-500">Assign Provider</option>
                              {providers.filter(p => p.active).map(provider => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => updateRequestStatus(request.id, 'completed')}
                              className="text-green-700 hover:text-green-900 font-semibold text-sm transition-colors"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {request.status === 'assigned' && (
                          <button
                            onClick={() => updateRequestStatus(request.id, 'completed')}
                            className="text-green-700 hover:text-green-900 font-semibold text-sm transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
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
