'use client'

import { useEffect } from 'react'

/**
 * Forces the window to scroll to (0, 0) the first time this component mounts
 * on a page. Used on product listing/detail pages where browser scroll
 * restoration (back-forward cache, PWA reopens) was landing users a few
 * dozen pixels below the top of the page.
 */
export default function ScrollResetOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return null
}
