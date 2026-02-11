export type ServiceType = 'tow' | 'battery_jump' | 'flat_tire' | 'fuel_delivery' | 'minor_repair'
export type RequestStatus = 'pending' | 'assigned' | 'completed'

export interface Provider {
  id: string
  name: string
  phone: string
  service_types: ServiceType[]
  coverage_area: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  service_type: ServiceType
  user_phone: string
  location_link: string
  status: RequestStatus
  provider_id?: string
  notes?: string
  created_at: string
  updated_at: string
  provider?: Provider
}

export interface NewRequest {
  service_type: ServiceType
  user_phone: string
  location_link: string
  notes?: string
}

export interface NewProvider {
  name: string
  phone: string
  service_types: ServiceType[]
  coverage_area: string
  active?: boolean
}
