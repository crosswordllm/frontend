import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CrosswordGame from './pages/Crossword'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CrosswordGame />
  </StrictMode>,
)
