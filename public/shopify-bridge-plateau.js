(function () {
  'use strict'

  var IFRAME_ID = 'plateau-viewer'

  // Plateau field IDs
  var KNOWN_FIELD_IDS = {
    313063: true,  // Case Color
    741708: true,  // All Buttons (dropdown — "Different Colors For Each Button" or a color name)
    784763: true,  // Directions Buttons
    779935: true,  // C-Stick Buttons
    926482: true,  // A Button
    958032: true,  // B Button
    849676: true,  // Z Button
    285053: true,  // LR/XY Buttons
    16152: true,   // Shield/Start/Dpad Buttons
  }

  // Regex to parse TC radio input IDs:
  // tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}-{ColorName}
  var TC_ID_PATTERN = /^tcustomizer-form-field-(\d+)-(\d+)-(.+)$/

  // Regex to parse TC select element IDs:
  // tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}
  var TC_SELECT_PATTERN = /^tcustomizer-form-field-(\d+)-(\d+)$/

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

  function handleRadioInput(input) {
    if (!input.checked) return
    var match = TC_ID_PATTERN.exec(input.id)
    if (!match) return
    var fieldId = parseInt(match[1], 10)
    var colorName = match[3]
    if (!KNOWN_FIELD_IDS[fieldId] || !colorName) return
    send({ type: 'SET_COLOR', fieldId: fieldId, colorName: colorName })
  }

  function handleSelectInput(select) {
    var match = TC_SELECT_PATTERN.exec(select.id)
    if (!match) return
    var fieldId = parseInt(match[1], 10)
    var colorName = select.value
    if (!KNOWN_FIELD_IDS[fieldId] || !colorName) return
    send({ type: 'SET_COLOR', fieldId: fieldId, colorName: colorName })
  }

  function handleChange(e) {
    var target = e.target

    // Handle radio inputs
    if (target && target.tagName === 'INPUT' && target.type === 'radio') {
      if (target.classList.contains('tcustomizer__btn-check')) {
        handleRadioInput(target)
      }
      return
    }

    // Handle select dropdowns
    if (target && target.tagName === 'SELECT') {
      handleSelectInput(target)
    }
  }

  function syncCurrentValues() {
    // Sync checked radio buttons
    var checked = document.querySelectorAll('input.tcustomizer__btn-check[type="radio"]:checked')
    checked.forEach(function (input) {
      handleRadioInput(input)
    })

    // Sync select dropdowns
    var selects = document.querySelectorAll('select[id^="tcustomizer-form-field-"]')
    selects.forEach(function (select) {
      handleSelectInput(select)
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

    // Listen for TC radio and select changes on the whole document
    document.addEventListener('change', handleChange, true)

    // MutationObserver: re-sync when TC dynamically updates the DOM
    var observer = new MutationObserver(function () {
      if (ready) syncCurrentValues()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['checked', 'value'],
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
