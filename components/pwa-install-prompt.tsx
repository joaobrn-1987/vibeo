'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'vibeo-pwa-decision'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
}

function isInStandaloneMode() {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Already decided or already installed
    if (localStorage.getItem(STORAGE_KEY)) return
    if (isInStandaloneMode()) return

    // Only on mobile/tablet
    const isMobile = window.innerWidth < 1024
    if (!isMobile) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      // iOS: show custom instructions after 4s
      const t = setTimeout(() => setShowPrompt(true), 4000)
      return () => clearTimeout(t)
    }

    // Android / Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    localStorage.setItem(STORAGE_KEY, outcome) // 'accepted' or 'dismissed'
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-6 md:w-96"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header strip */}
            <div className="bg-primary-500 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M12 21.593c-.5-.396-9-7.04-9-12.093 0-3.31 2.69-6 6-6 1.88 0 3.55.87 4.64 2.23.22.27.42.57.6.88.18-.31.38-.61.6-.88C15.95 4.37 17.62 3.5 19.5 3.5c3.31 0 6 2.69 6 6 0 5.053-8.5 11.697-9 12.093z"/>
                </svg>
                <span className="text-white font-bold text-sm">Vibeo</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white transition-colors p-1"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {isIOSDevice ? (
                /* iOS instructions */
                <>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    Adicione Vibeo à sua tela inicial
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    Acesse rapidamente como um app, sem abrir o Safari.
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Share className="w-3.5 h-3.5 text-primary-500" />
                      </div>
                      <span>Toque em <strong>Compartilhar</strong> <Share className="inline w-3 h-3" /> na barra do Safari</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-3.5 h-3.5 text-primary-500" />
                      </div>
                      <span>Selecione <strong>Adicionar à Tela de Início</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="mt-4 w-full border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-2.5 rounded-xl transition-colors min-h-[44px]"
                  >
                    Entendi, obrigado
                  </button>
                </>
              ) : (
                /* Android / Chrome */
                <>
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    Adicionar Vibeo à tela inicial
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    Instale como app para acesso rápido, funciona até offline.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstall}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors min-h-[44px]"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors min-h-[44px]"
                    >
                      Agora não
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
