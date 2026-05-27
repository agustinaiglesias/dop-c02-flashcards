import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FlashcardsApp from '../dop_flashcards.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FlashcardsApp />
  </StrictMode>,
)
