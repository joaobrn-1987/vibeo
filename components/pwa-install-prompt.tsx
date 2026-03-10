'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or if on desktop
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) return

    // Only show on mobile/tablet
    if (window.innerWidth >= 1024) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', '1')
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="#FAF7F2" className="w-8 h-8">
                <path d="M12 21.593c-.5-.396-9-7.04-9-12.093 0-3.31 2.69-6 6-6 1.88 0 3.55.87 4.64 2.23.22.27.42.57.6.88.18-.31.38-.61.6-.88C15.95 4.37 17.62 3.5 19.5 3.5c3.31 0 6 2.69 6 6 0 5.053-8.5 11.697-9 12.093z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Adicionar Vibeo à tela inicial</p>
              <p className="text-gray-500 text-xs mt-0.5">Acesse rapidamente sem abrir o navegador</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors min-h-[44px]"
                >
                  Adicionar
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors min-h-[44px]"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
