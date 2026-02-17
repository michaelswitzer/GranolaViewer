(function () {
  'use strict'

  var IFRAME_ID = 'beacon-viewer'
  var FIELD_LABELS = {
    'Case Color': 313063,
    '24mm Buttons Color': 784763,
    '30mm Buttons Color': 779935,
    'Menu Buttons Color': 926482,
  }

  var iframe = null
  var ready = false
  var queue = []

  function send(msg) {
    if (!iframe || !iframe.contentWindow) return
    if (ready) {
      iframe.contentWindow.postMessage(msg, '*')
    } else {
      queue.push(msg)
    }
  }

  function flush() {
    if (!iframe || !iframe.contentWindow) return
    queue.forEach(function (msg) {
      iframe.contentWindow.postMessage(msg, '*')
    })
    queue = []
  }

  // Find the field ID from a label string
  function fieldIdFromLabel(label) {
    for (var key in FIELD_LABELS) {
      if (label.indexOf(key) !== -1) {
        return FIELD_LABELS[key]
      }
    }
    return null
  }

  // Extract color name from an element (input value, selected option text, swatch label, etc.)
  function extractColorValue(el) {
    if (el.tagName === 'SELECT') {
      return el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : ''
    }
    if (el.tagName === 'INPUT') {
      if (el.type === 'radio' || el.type === 'checkbox') {
        // Look for a nearby label
        var label =
          el.closest('label') ||
          document.querySelector('label[for="' + el.id + '"]')
        return label ? label.textContent.trim() : el.value
      }
      return el.value
    }
    return ''
  }

  // Find the closest field label for a changed element
  function findFieldLabel(el) {
    // Walk up the DOM looking for a label or heading that matches our known fields
    var node = el
    for (var i = 0; i < 10 && node; i++) {
      var text = node.textContent || ''
      for (var key in FIELD_LABELS) {
        if (text.indexOf(key) !== -1) {
          return key
        }
      }
      node = node.parentElement
    }
    return null
  }

  function handleChange(e) {
    var target = e.target
    if (!target || (!target.tagName === 'INPUT' && !target.tagName === 'SELECT'))
      return

    var label = findFieldLabel(target)
    if (!label) return

    var fieldId = FIELD_LABELS[label]
    var colorName = extractColorValue(target)
    if (!fieldId || !colorName) return

    send({ type: 'SET_COLOR', fieldId: fieldId, colorName: colorName })
  }

  // Read current values from all fields and sync
  function syncCurrentValues() {
    var form = document.querySelector('form[action*="/cart"]') || document.querySelector('.product-form')
    if (!form) return

    var selects = form.querySelectorAll('select')
    selects.forEach(function (sel) {
      var label = findFieldLabel(sel)
      if (!label) return
      var fieldId = FIELD_LABELS[label]
      var colorName = extractColorValue(sel)
      if (fieldId && colorName) {
        send({ type: 'SET_COLOR', fieldId: fieldId, colorName: colorName })
      }
    })

    // Also check for checked radio buttons
    var radios = form.querySelectorAll('input[type="radio"]:checked')
    radios.forEach(function (radio) {
      var label = findFieldLabel(radio)
      if (!label) return
      var fieldId = FIELD_LABELS[label]
      var colorName = extractColorValue(radio)
      if (fieldId && colorName) {
        send({ type: 'SET_COLOR', fieldId: fieldId, colorName: colorName })
      }
    })
  }

  function init() {
    iframe = document.getElementById(IFRAME_ID)
    if (!iframe) return

    // Listen for VIEWER_READY from iframe
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'VIEWER_READY') {
        ready = true
        flush()
        syncCurrentValues()
      }
    })

    // Use event delegation on the product form area
    var formContainer =
      document.querySelector('form[action*="/cart"]') ||
      document.querySelector('.product-form') ||
      document.body

    formContainer.addEventListener('change', handleChange, true)

    // MutationObserver to detect Tapcart dynamic field rendering
    var observer = new MutationObserver(function () {
      // Re-sync when DOM changes (Tapcart fields may have appeared)
      if (ready) {
        syncCurrentValues()
      }
    })

    observer.observe(formContainer, {
      childList: true,
      subtree: true,
    })
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
