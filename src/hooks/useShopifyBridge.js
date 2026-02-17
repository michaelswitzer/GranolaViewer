import { useEffect } from 'react'
import { FIELD_MAP } from '../colors'

export default function useShopifyBridge(onColorChange) {
  useEffect(() => {
    function handleMessage(event) {
      // Origin validation (uncomment for production)
      // if (!event.origin.includes('granola.games')) return

      const { data } = event
      if (!data || typeof data !== 'object') return

      if (data.type === 'SET_COLOR') {
        const stateKey = FIELD_MAP[data.fieldId]
        if (stateKey && data.colorName) {
          onColorChange(stateKey, data.colorName)
        }
      }

      if (data.type === 'SET_ALL_COLORS') {
        // Bulk sync: data.colors = { fieldId: colorName, ... }
        if (data.colors && typeof data.colors === 'object') {
          for (const [fieldId, colorName] of Object.entries(data.colors)) {
            const stateKey = FIELD_MAP[Number(fieldId)]
            if (stateKey && colorName) {
              onColorChange(stateKey, colorName)
            }
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Signal to parent that we're ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'VIEWER_READY' }, '*')
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [onColorChange])
}
