import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Sécurité : l'app n'utilise PAS de service worker. On désinscrit donc tout
// service worker résiduel (d'une ancienne version / PWA) qui pourrait
// intercepter et bloquer les requêtes réseau (page figée sur "Chargement...").
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => {
      if (regs.length === 0) return
      Promise.all(regs.map(reg => reg.unregister())).then(() => {
        if ('caches' in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
        }
        // Recharge une seule fois pour repartir sans le service worker
        if (!sessionStorage.getItem('sw-cleaned')) {
          sessionStorage.setItem('sw-cleaned', '1')
          console.log('[cleanup] service worker résiduel supprimé — rechargement propre')
          window.location.reload()
        }
      })
    })
    .catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
