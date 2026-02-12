// Analytics and performance monitoring

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  timestamp?: number
}

export interface PerformanceMetrics {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  fcp: number // First Contentful Paint
}

class Analytics {
  private isInitialized = false
  private events: AnalyticsEvent[] = []

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return

    this.isInitialized = true
    this.setupPerformanceObserver()
    this.trackPageView()
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackPerformance('lcp', entry.startTime)
          } else if (entry.entryType === 'first-input') {
            this.trackPerformance('fid', (entry as PerformanceEventTiming).processingStart - entry.startTime)
          } else if (entry.entryType === 'layout-shift') {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              this.trackPerformance('cls', (entry as PerformanceEntry & { value?: number }).value || 0)
            }
          }
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    }
  }

  trackEvent(name: string, properties?: Record<string, unknown>) {
    if (!this.isInitialized) return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now()
    }

    this.events.push(event)
    
    // Send to analytics service (implementation depends on your analytics provider)
    this.sendEvent(event)
  }

  trackPageView() {
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    })
  }

  trackFormSubmit(formName: string, success: boolean, error?: string) {
    this.trackEvent('form_submit', {
      form_name: formName,
      success,
      error
    })
  }

  trackLanguageChange(from: string, to: string) {
    this.trackEvent('language_change', {
      from,
      to
    })
  }

  trackLocationRequest(success: boolean, accuracy?: number, error?: string) {
    this.trackEvent('location_request', {
      success,
      accuracy,
      error
    })
  }

  private trackPerformance(metric: string, value: number) {
    this.trackEvent('performance_metric', {
      metric,
      value
    })
  }

  private sendEvent(event: AnalyticsEvent) {
    // Example implementation for Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as { gtag: (command: string, eventName: string, properties?: Record<string, unknown>) => void }).gtag('event', event.name, event.properties || {})
    }

    // Example implementation for custom analytics
    // You can replace this with your preferred analytics service
    console.log('Analytics Event:', event)
  }

  getMetrics(): PerformanceMetrics | null {
    if (typeof window === 'undefined' || !window.performance) return null

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      lcp: this.getMetricValue('lcp'),
      fid: this.getMetricValue('fid'),
      cls: this.getMetricValue('cls'),
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: this.getMetricValue('fcp') || navigation.responseStart
    }
  }

  private getMetricValue(metric: string): number {
    const metricEvents = this.events.filter(e => 
      e.name === 'performance_metric' && e.properties?.metric === metric
    )
    
    if (metricEvents.length === 0) return 0
    
    // For CLS, we want the sum of all values
    if (metric === 'cls') {
      return metricEvents.reduce((sum, e) => sum + ((e.properties?.value as number) || 0), 0)
    }
    
    // For other metrics, we want the latest value
    return ((metricEvents[metricEvents.length - 1]?.properties?.value) as number) || 0
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics()
    if (!metrics) return 'No performance data available'

    return `
Performance Report:
- Largest Contentful Paint (LCP): ${metrics.lcp.toFixed(0)}ms ${metrics.lcp < 2500 ? '✅ Good' : metrics.lcp < 4000 ? '⚠️ Needs Improvement' : '❌ Poor'}
- First Input Delay (FID): ${metrics.fid.toFixed(0)}ms ${metrics.fid < 100 ? '✅ Good' : metrics.fid < 300 ? '⚠️ Needs Improvement' : '❌ Poor'}
- Cumulative Layout Shift (CLS): ${metrics.cls.toFixed(3)} ${metrics.cls < 0.1 ? '✅ Good' : metrics.cls < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor'}
- Time to First Byte (TTFB): ${metrics.ttfb.toFixed(0)}ms ${metrics.ttfb < 800 ? '✅ Good' : metrics.ttfb < 1800 ? '⚠️ Needs Improvement' : '❌ Poor'}
- First Contentful Paint (FCP): ${metrics.fcp.toFixed(0)}ms ${metrics.fcp < 1800 ? '✅ Good' : metrics.fcp < 3000 ? '⚠️ Needs Improvement' : '❌ Poor'}
    `.trim()
  }
}

export const analytics = new Analytics()

// Initialize analytics when the module loads
if (typeof window !== 'undefined') {
  // Initialize after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.initialize())
  } else {
    analytics.initialize()
  }
}
