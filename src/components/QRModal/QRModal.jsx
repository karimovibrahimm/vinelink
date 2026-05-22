import { useState, useEffect } from 'react'
import './QRModal.css'

const QR_BASE = 'https://api.qrserver.com/v1/create-qr-code'

export default function QRModal({ username, url, onClose }) {
  const [downloading, setDownloading] = useState(false)

  const qrUrl = `${QR_BASE}/?size=600x600&data=${encodeURIComponent(url)}&color=1a3a2a&bgcolor=ffffff&margin=2`

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res  = await fetch(qrUrl)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `${username}-vinelink-qr.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(qrUrl, '_blank')
    }
    setDownloading(false)
  }

  return (
    <>
      <div className="qr__overlay" onClick={onClose} />

      <div className="qr__modal">
        <div className="qr__modal-header">
          <div>
            <h2 className="qr__modal-title">Your QR Code</h2>
            <p className="qr__modal-url">{url}</p>
          </div>
          <button className="qr__modal-close" onClick={onClose}>✕</button>
        </div>

        <img src={qrUrl} alt="QR Code" className="qr__modal-image" />

        <p className="qr__modal-hint">
          Share at events or on physical products — scanning it opens your Vinelink page.
        </p>

        <button className="qr__modal-download" onClick={handleDownload} disabled={downloading}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? 'Downloading…' : 'Download PNG'}
        </button>
      </div>
    </>
  )
}
