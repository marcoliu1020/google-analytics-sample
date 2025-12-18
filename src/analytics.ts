declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

let initialized = false

const createGtagStub = () => {
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
}

export const initAnalytics = () => {
  if (initialized) return

  if (!measurementId) {
    console.warn(
      '[ga] VITE_GA_MEASUREMENT_ID not set; events will only log to the console.',
    )
    return
  } else {
    console.log(`[ga] initializing with measurement ID: ${measurementId}`) // debug
  }

  createGtagStub()

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.gtag?.('js', new Date())
  window.gtag?.('config', measurementId)
  initialized = true
}

export const trackEvent = (
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
) => {
  if (!window.gtag) {
    createGtagStub()
  }

  if (!measurementId) {
    console.warn('could not send event to GA, missing measurement ID')
    console.info('[ga-stub]', name, params)
    return
  }

  window.gtag?.('event', name, params)
}
