(function () {
  'use strict'

  var IFRAME_ID = 'beacon-viewer'

  // Trademark Customs field IDs we care about
  var KNOWN_FIELD_IDS = {
    313063: true, // Case Color
    784763: true, // 24mm Buttons Color
    779935: true, // 30mm Buttons Color
    926482: true, // Menu Buttons Color
  }

  // Regex to parse TC radio input IDs:
  // tcustomizer-form-field-{FIELD_ID}-{PRODUCT_ID}-{ColorName}
  var TC_ID_PATTERN = /^tcustomizer-form-field-(\d+)-(\d+)-(.+)$/

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

  function handleChange(e) {
    var target = e.target
    if (!target || target.tagName !== 'INPUT' || target.type !== 'radio') return
    if (!target.classList.contains('tcustomizer__btn-check')) return
    handleRadioInput(target)
  }

  function syncCurrentValues() {
    var checked = document.querySelectorAll('input.tcustomizer__btn-check[type="radio"]:checked')
    checked.forEach(function (input) {
      handleRadioInput(input)
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

    // Listen for TC radio changes on the whole document (TC widget may be outside the cart form)
    document.addEventListener('change', handleChange, true)

    // MutationObserver: re-sync when TC dynamically updates the DOM
    var observer = new MutationObserver(function () {
      if (ready) syncCurrentValues()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['checked'],
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
