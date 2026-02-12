import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import LanguageSelector from '@/components/LanguageSelector'

// Mock the next-intl hook
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

describe('LanguageSelector', () => {
  const mockPush = jest.fn()
  const mockPathname = '/en/services'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(usePathname as jest.Mock).mockReturnValue(mockPathname)
  })

  it('renders language selector button', () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('🇺🇸')
  })

  it.skip('displays language dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Language')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Français')).toBeInTheDocument()
      expect(screen.getByText('العربية')).toBeInTheDocument()
    })
  })

  it('changes language when French is selected', async () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(button)

    const frenchOption = await screen.findByText('Français')
    fireEvent.click(frenchOption)

    expect(mockPush).toHaveBeenCalledWith('/fr/services')
  })

  it('changes language when Arabic is selected', async () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(button)

    const arabicOption = await screen.findByText('العربية')
    fireEvent.click(arabicOption)

    expect(mockPush).toHaveBeenCalledWith('/ar/services')
  })

  it('closes dropdown after language selection', async () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(button)

    const frenchOption = await screen.findByText('Français')
    fireEvent.click(frenchOption)

    await waitFor(() => {
      expect(screen.queryByText('Language')).not.toBeInTheDocument()
    })
  })

  it.skip('highlights current language', async () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button', { name: /select language/i })
    fireEvent.click(button)

    const englishOption = await screen.findByText('English')
    const buttonElement = englishOption.closest('button')
    expect(buttonElement).toHaveClass('bg-blue-900')
  })
})
