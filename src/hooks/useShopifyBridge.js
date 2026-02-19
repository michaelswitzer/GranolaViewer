import { useEffect } from 'react'

export default function useShopifyBridge(onColorChange, productConfig) {
  const { fieldMap, specialFields } = productConfig

  useEffect(() => {
    function applyColor(fieldId, colorName) {
      // Check special fields first
      const handler = specialFields[fieldId]
      if (handler) {
        const result = handler(colorName)
        if (result === null) return
        for (const [key, value] of result) {
          onColorChange(key, value)
        }
        return
      }

      // Regular field map lookup
      const stateKey = fieldMap[fieldId]
      if (stateKey && colorName) {
        onColorChange(stateKey, colorName)
      }
    }

    function handleMessage(event) {
      const { data } = event
      if (!data || typeof data !== 'object') return

      if (data.type === 'SET_COLOR') {
        applyColor(data.fieldId, data.colorName)
      }

      if (data.type === 'SET_ALL_COLORS') {
        if (data.colors && typeof data.colors === 'object') {
          for (const [fieldId, colorName] of Object.entries(data.colors)) {
            applyColor(Number(fieldId), colorName)
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
  }, [onColorChange, productConfig])
}
