"use strict"

interface Quote {
  _id: string,
  tags: string[],
  content: string,
  author: string,
  authorSlug: string,
  length: number,
  dateAdded: string,
  dateModified: string,
}

interface StringKeyToStringValue {
  [key: string]: string
}

const WORD_SIZE = 5
const QUOTE_API = "https://api.quotable.io/random"
const DEFAULT_KEYBOARD_LAYOUT = [
  ["Escape", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["CapsLock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
  [" "],
]
const SHIFT_ENABLED_KEYBOARD_LAYOUT = [
  ["Escape", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "Backspace"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "{", "}", "|"],
  ["CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ":", "\"", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", "<", ">", "?", "Shift"],
  [" "],
]
const CAPS_ENABLED_KEYBOARD_LAYOUT = [
  ["Escape", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
  ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
  [" "],
]
const SPECIAL_KEYS: StringKeyToStringValue = {
  " ": "Spacebar",
  "Shift": "Shift",
  "Tab": "Tab",
  "Enter": "Enter",
  "Backspace": "Backspace",
  "Escape": "Esc",
  "CapsLock": "Caps",
}

let currentQuoteIndex: number = 0
let wordsPerMinute: number = 0
let wordAccuracy: number = 0
let startTime: number = 0

let keypressCache = new Map<string, string>()
let capslockEnabled: boolean = false

function calcWordsPerMinute() {
  let wordElements = document.getElementsByClassName("word")
  let totalCharacters = 0

  for (let i = 0; i < wordElements.length; i++)
    totalCharacters += wordElements[i].innerHTML.length

  let incorrectWords = document.getElementsByClassName("incorrect-word").length
  let minutes = ((Date.now() - startTime) / 1000) / 60

  wordsPerMinute = Math.round(((totalCharacters / WORD_SIZE) - incorrectWords) / minutes)
}

function calcWordAccuracy() {
  let correctWords = document.getElementsByClassName("correct-word").length
  let totalWords = document.getElementsByClassName("word").length
  wordAccuracy = Math.round((correctWords / totalWords) * 100)
}

async function fetchQuote(): Promise<Quote> {
  let fetchedQuote = await fetch(QUOTE_API)
  let result = await fetchedQuote.json()
  return result
}

function inputKeydownEvent(event: KeyboardEvent) {
  if (startTime === 0 && event.key.match(/^[a-zA-Z]$/))
    startTime = Date.now()

  let inputElement = <HTMLInputElement>document.getElementById("input")

  if (event.key === ' ') {
    event.preventDefault()
    
    let wordElements = document.getElementById("quote-element")?.children
    let wordElementsLength = wordElements?.length

    if (currentQuoteIndex === wordElementsLength)
      inputElement.value = ''
  }
  
  if (event.key === ' ' && inputElement.value !== '') {
    let quoteElement = document.getElementById("quote-element")
    let quoteElementChildren = quoteElement?.children

    if (quoteElementChildren !== undefined) {
      let currWord = quoteElementChildren[currentQuoteIndex]
      let currWordClassList = currWord.classList

      if (currWordClassList.contains('current-word'))
        currWordClassList.remove('current-word')

      if (currWord.textContent !== inputElement.value)
        currWordClassList.add('incorrect-word')

      if (currWord.textContent === inputElement.value)
        quoteElementChildren[currentQuoteIndex].classList.add('correct-word')

      if (currentQuoteIndex + 1 < quoteElementChildren.length)
        quoteElementChildren[currentQuoteIndex + 1].classList.add('current-word')
    }

    currentQuoteIndex++

    if (currentQuoteIndex === quoteElementChildren?.length) {
      calcWordAccuracy()
      calcWordsPerMinute()
      initStatistics()
    }

    inputElement.value = ''
  }
}

async function initQuote() {
  let quote = await fetchQuote()
  let quoteElement = document.getElementById("quote-element")

  quote.content
    //.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    //.replace(/\s{2,}/g," ")
    .split(' ')
    .map(function(word: string) {
      let wordElement = document.createElement("div")
      let wordElementTextNode = document.createTextNode(word)

      // wordElement.id = word
      wordElement.classList.add('word')
      wordElement.appendChild(wordElementTextNode)

      quoteElement?.append(wordElement)
    })

  let quoteElementChildren = quoteElement?.children

  if (quoteElementChildren !== undefined)
    quoteElementChildren[currentQuoteIndex].classList.add('current-word')
}

function initInput() {
  let inputElement = document.getElementById("input")
  inputElement?.addEventListener("keydown", inputKeydownEvent)
  inputElement?.focus()
}

function initVisualKeyboard(layout: string[][]) {
  let keyboardWrapper = document.getElementById("keyboard-wrapper")

  layout.map(function(row: string[]) {
    let keyboardRow = document.createElement("div")

    keyboardRow.classList.add('keyboard-row')

    row.map(function(key: string) {
      let keyElement = document.createElement("div")

      if (SPECIAL_KEYS[key] !== undefined) {
        key = SPECIAL_KEYS[key]
        keyElement.classList.add(key.toLowerCase())
      }

      keyElement.classList.add('default-key')

      if (key === "Caps" && capslockEnabled)
        keyElement.classList.add('pressed-key')

      keyElement.id = key
      keyElement.append(key)

      keyboardRow.appendChild(keyElement)
    })

    keyboardWrapper?.appendChild(keyboardRow)
  })
}

function initRefresh() {
  let refreshButton = document.getElementById("refresh")
  refreshButton?.addEventListener("click", function() {
    currentQuoteIndex = 0

    let wordElement = document.getElementById("quote-element")
    if (wordElement !== null)
      wordElement.innerHTML = ''
    initQuote()

    let inputElement = <HTMLInputElement>document.getElementById("input")
    inputElement?.focus()
    inputElement.value = ''

    wordAccuracy = 0
    wordsPerMinute = 0
    initStatistics()

    startTime = 0
  })
}

function initStatistics() {
  let statisticsElement = document.getElementById("statistics")

  let getWordsPerMinute = wordsPerMinute === 0 ? '??' : wordsPerMinute
  let getWordAccuracy = wordAccuracy === 0 ? '??' : wordAccuracy

  let statistics = `WPM=${getWordsPerMinute} | ACC=${getWordAccuracy}%`
  let statisticsText = document.createTextNode(statistics)

  if (statisticsElement?.innerText !== undefined)
    statisticsElement.innerText = ''
    
  statisticsElement?.appendChild(statisticsText)
}

document.addEventListener("keydown", function(event: KeyboardEvent) {
  if (keypressCache.get(event.code) === undefined) {
    keypressCache.set(event.code, event.code)

    if (event.key === "CapsLock") {
      let keyboardElement = document.getElementById("keyboard-wrapper")
      keyboardElement!.innerHTML = ''

      if (!capslockEnabled) {
        initVisualKeyboard(CAPS_ENABLED_KEYBOARD_LAYOUT)
      } else {
        initVisualKeyboard(DEFAULT_KEYBOARD_LAYOUT)
      }

      capslockEnabled = !capslockEnabled
    }

    if (event.key === "Shift") {
      if (!capslockEnabled) {
        let keyboardElement = document.getElementById("keyboard-wrapper")
        keyboardElement!.innerHTML = ''
        initVisualKeyboard(SHIFT_ENABLED_KEYBOARD_LAYOUT)
      } else {
        let keyboardElement = document.getElementById("keyboard-wrapper")
        keyboardElement!.innerHTML = ''
        initVisualKeyboard(DEFAULT_KEYBOARD_LAYOUT)
      }

      let shiftElements = document.getElementsByClassName("shift")
      shiftElements[1].classList.add('pressed-key')
    }

    let keyElement = document.getElementById(
      SPECIAL_KEYS[event.key] === undefined ?
        event.key : SPECIAL_KEYS[event.key]
    )

    if (event.key === 'CapsLock') {
      if (capslockEnabled)
        keyElement?.classList.add('pressed-key')
      else {
        console.log("borpa")
        keyElement?.classList.remove('pressed-key')
      }

      return
    }
        
    keyElement?.classList.add('pressed-key')
  }
})

document.addEventListener("keyup", function(event: KeyboardEvent) {
  keypressCache.delete(event.code)

  if (event.key === "CapsLock")
    return

  if (event.key === "Shift" && !capslockEnabled) {
    let keyboardElement = document.getElementById("keyboard-wrapper")
    keyboardElement!.innerHTML = ''
    initVisualKeyboard(DEFAULT_KEYBOARD_LAYOUT)
  }

  if (event.key === "Shift" && capslockEnabled) {
    let shiftElements = document.getElementsByClassName("shift")
    shiftElements[1].classList.remove('pressed-key')
    let keyboardElement = document.getElementById("keyboard-wrapper")
    keyboardElement!.innerHTML = ''
    initVisualKeyboard(CAPS_ENABLED_KEYBOARD_LAYOUT)
  }

  let keyElement = document.getElementById(
    SPECIAL_KEYS[event.key] === undefined ?
      event.key : SPECIAL_KEYS[event.key]
  )

  keyElement?.classList.remove('pressed-key')
})

async function main() {
  initQuote()
  initInput()
  initRefresh()
  initStatistics()
  initVisualKeyboard(DEFAULT_KEYBOARD_LAYOUT)
}

main()

