// Select all calculator buttons and output fields
const keypadsBtns = document.querySelectorAll('.keypads button')
const outputs = document.querySelectorAll('.output input')
const historyList = document.querySelector('.history-list')

// Load saved history when the page starts
renderHistory(getHistory(), historyList)

// Track whether the last action was a completed calculation
let hasCalculated = false

// Attach click handlers to every keypad button
keypadsBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    displayPV(btn.dataset.role)
  })
})

// Listen for keyboard input so the calculator works without clicking
document.addEventListener('keydown', (event) => {
  const key = event.key

  if (key === 'Enter') {
    event.preventDefault()
    displayPV('equal')
    return
  }

  if (key === 'Backspace') {
    event.preventDefault()
    displayPV('delete')
    return
  }

  if (key === 'Escape') {
    event.preventDefault()
    displayPV('clear')
    return
  }

  if (/^[0-9.+\-*/]$/.test(key)) {
    event.preventDefault()
    displayPV(mapKeyboardKey(key))
  }
})

// Handle all button and keyboard actions for the calculator display
function displayPV(padVal) {
  // Clear the display when CE/C is pressed
  if (padVal === 'clear') {
    outputs[0].value = ''
    outputs[1].value = ''
    hasCalculated = false
    return
  }

  // Delete the last character from the expression when Backspace or DEL is used
  if (padVal === 'delete') {
    outputs[0].value = outputs[0].value.slice(0, -1)
    outputs[1].value = ''
    hasCalculated = false
    return
  }

  // Evaluate the expression when the equal button or Enter key is used
  if (padVal === 'equal') {
    const cal = outputs[0].value.trim()

    if (!cal) {
      return
    }

    const result = evaluateExpression(cal)

    // Show the expression and result in the output fields
    outputs[0].value = cal
    outputs[1].value = result
    hasCalculated = true

    // Save successful calculations to history
    if (result !== 'Input Error!') {
      const newHistory = getHistory()
      const id = newHistory.length + 1
      newHistory.unshift({ id, cal, result, time_stored: new Date().toLocaleTimeString(), date_stored: new Date().toLocaleDateString()})
      saveHistory(newHistory)
      renderHistory(newHistory, historyList)
      document.querySelector(`.list${id}`).scrollIntoView({
        behavior: "smooth"
      })
    }

    return
  }

  // Start a fresh input after a previous result was shown
  if (hasCalculated) {
    outputs[0].value = ''
    outputs[1].value = ''
    hasCalculated = false
  }

  // Convert button roles to the correct operator character
  const value = mapPadValue(padVal)
  outputs[0].value += value
}

// Convert keypad button roles into the actual symbols used in the expression
function mapPadValue(role) {
  switch (role) {
    case 'divide':
      return '/'
    case 'multiply':
      return '*'
    case 'minus':
      return '-'
    case 'add':
      return '+'
    default:
      return role
  }
}

// Convert physical keyboard keys into the same roles used by the keypad buttons
function mapKeyboardKey(key) {
  if (key === '+') {
    return 'add'
  }

  if (key === '-') {
    return 'minus'
  }

  if (key === '*') {
    return 'multiply'
  }

  if (key === '/') {
    return 'divide'
  }

  return key
}

// Safely evaluate the typed math expression
function evaluateExpression(expression) {
  const sanitizedExpression = expression.replace(/\s+/g, '')

  if (!sanitizedExpression || !/^[0-9+\-*/().]+$/.test(sanitizedExpression)) {
    return 'Input Error!'
  }

  try {
    return Function(`"use strict"; return (${sanitizedExpression})`)()
  } catch {
    return 'Input Error!'
  }
}

// Read history from browser storage
function getHistory() {
  return JSON.parse(localStorage.getItem('history')) || []
}

// Save a new history entry to browser storage
function saveHistory(historyItems) {
  localStorage.setItem('history', JSON.stringify(historyItems))
}

// Render the saved history items to the history panel
function renderHistory(historyItems, historyList) {
  let historyHTML = ''

  historyItems.forEach((item) => {
    historyHTML += `
      <div class="list list${item.id}">
        <div class="cal">${item.cal} =</div>
        <div class="result">${item.result}</div>
        <div class="popup">
          <div class="date" style="color: var(--dark-white-txt);">
          Date: <strong>${item.date_stored}</strong>
          </div>
          <div class="time" style="color: var(--dark-white-txt);">
          Time: <strong>${item.time_stored}</strong>
          </div>
          <div class="trash" data-id="${item.id}" title="delete"><i class="fa fa-trash"></i></div>
        </div>
      </div>
    `
  })

  if (historyHTML === '') {
    historyList.innerHTML = "There's no history yet"
  } else {
    historyList.innerHTML = historyHTML
  }

  historyList.querySelectorAll('.list').forEach((item) => {
    item.addEventListener('click', () => {
      const cal = item.querySelector('.cal').textContent.replace(' =', '')
      const result = item.querySelector('.result').textContent

      outputs[0].value = cal // Remove the " =" at the end
      outputs[1].value = result
      hasCalculated = true 
    })
  })

  historyList.querySelectorAll('.trash').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c_his = getHistory()
      const newHistory = c_his.filter(h => h.id !== parseInt(btn.dataset.id))

      document.querySelector(`.list${btn.dataset.id}`).remove()
      saveHistory(newHistory)
    })
  })
}