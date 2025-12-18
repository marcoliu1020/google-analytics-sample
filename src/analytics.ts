import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

declare global {
  interface Window {
    dataLayer?: Array<unknown | IArguments>
    gtag?: (...args: unknown[]) => void
  }
}

const measurementId =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-D94ZSJ9JEG' // default to demo id

let initialized = false

const createGtagStub = () => {
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      // keep parity with the official snippet: push the arguments object
      window.dataLayer?.push(args)
    }
}

const useAnalyticsInit = () => {
  useEffect(() => {
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
    window.gtag?.('js', new Date())
    window.gtag?.('config', measurementId)
    initialized = true
  }, [])
}

export const AnalyticsScript = () => {
  useAnalyticsInit()

  if (!measurementId) return null

  return createPortal(
    React.createElement('script', {
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    }),
    document.head,
  )
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
