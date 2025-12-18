declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

type EventParams = Record<string, string | number | boolean | undefined>
type PendingEvent = { name: string; params?: EventParams }

let initialized = false
let gtagLoaded = false
let gtagFailed = false
let gtagLoadTimeout: number | undefined
const pendingEvents: PendingEvent[] = []
const fallbackClientIdKey = 'ga_fallback_client_id'

const getFallbackClientId = () => {
  if (typeof window === 'undefined') {
    return `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  try {
    const cached = window.localStorage.getItem(fallbackClientIdKey)
    if (cached) return cached

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.localStorage.setItem(fallbackClientIdKey, generated)
    return generated
  } catch {
    return `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const createGtagStub = () => {
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
}

const sendViaCollectFallback = (name: string, params?: EventParams) => {
  if (!measurementId) return

  const query = new URLSearchParams({
    v: '2',
    tid: measurementId,
    cid: getFallbackClientId(),
    en: name,
  })

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return
      const paramKey = typeof value === 'number' ? `epn.${key}` : `ep.${key}`
      query.append(paramKey, String(value))
    })
  }

  const endpoint = `https://www.google-analytics.com/g/collect?${query.toString()}`

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint)
    return
  }

  fetch(endpoint, { mode: 'no-cors' }).catch((err) => {
    console.warn('[ga] fallback collect request failed', err)
  })
}

const flushPendingToFallback = () => {
  if (!pendingEvents.length) return
  const events = [...pendingEvents]
  pendingEvents.length = 0
  events.forEach((evt) => sendViaCollectFallback(evt.name, evt.params))
}

const handleGtagLoadFailure = (reason: string) => {
  if (gtagFailed) return
  gtagFailed = true
  console.warn(`[ga] ${reason}; sending events via fetch fallback.`)
  flushPendingToFallback()
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
  script.onload = () => {
    gtagLoaded = true
    if (gtagLoadTimeout) window.clearTimeout(gtagLoadTimeout)
    pendingEvents.length = 0
  }
  script.onerror = () => {
    if (gtagLoadTimeout) window.clearTimeout(gtagLoadTimeout)
    handleGtagLoadFailure('gtag.js failed to load (blocked by extension or CSP)')
  }
  document.head.appendChild(script)

  gtagLoadTimeout = window.setTimeout(() => {
    if (!gtagLoaded) {
      handleGtagLoadFailure('gtag.js did not load within 5s')
    }
  }, 5000)

  window.gtag?.('js', new Date())
  window.gtag?.('config', measurementId)
  initialized = true
}

export const trackEvent = (
  name: string,
  params?: EventParams,
) => {
  if (!window.gtag) {
    createGtagStub()
  }

  if (!measurementId) {
    console.warn('could not send event to GA, missing measurement ID')
    console.info('[ga-stub]', name, params)
    return
  }

  if (!gtagLoaded && !gtagFailed) {
    pendingEvents.push({ name, params })
  }

  if (gtagFailed) {
    sendViaCollectFallback(name, params)
    return
  }

  window.gtag?.('event', name, params)
}
