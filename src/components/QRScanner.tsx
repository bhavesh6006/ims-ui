import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Box, Typography, keyframes } from '@mui/material'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
  width?: number
  height?: number
}

const scanLineAnimation = keyframes`
  0% { top: 5%; }
  50% { top: 85%; }
  100% { top: 5%; }
`

const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  width = 400,
  height = 300,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const containerId = 'qr-reader'

  useEffect(() => {
    let mounted = true
    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.PDF_417,
      ],
      verbose: false,
    })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          scanner
            .stop()
            .then(() => {
              if (mounted) onScan(decodedText)
            })
            .catch(console.error)
        },
        () => {
          // Silently ignore per-frame scan misses
        }
      )
      .then(() => {
        if (mounted) setCameraReady(true)
      })
      .catch((err) => {
        console.error('Failed to start scanner:', err)
        if (mounted) {
          setCameraError(
            'Failed to start camera. Please check camera permissions.'
          )
        }
        if (onError) {
          onError('Failed to start camera. Please check camera permissions.')
        }
      })

    return () => {
      mounted = false
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error)
          }
        } catch {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cameraError) {
    return (
      <Box
        sx={{
          width,
          height,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: 'error.main',
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography variant="body2" color="error" textAlign="center">
          📷 {cameraError}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          position: 'relative',
          width,
          height,
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: 'black',
          /*
           * Override html5-qrcode internal styles.
           * The library creates: #qr-reader > #qr-reader__scan_region > video
           * and also a dashboard div we want hidden.
           */
          '& #qr-reader': {
            width: '100% !important',
            height: '100% !important',
            border: 'none !important',
            overflow: 'hidden !important',
            position: 'relative !important',
          },
          '& #qr-reader video': {
            width: '100% !important',
            height: '100% !important',
            objectFit: 'cover !important',
            position: 'absolute !important',
            top: '0 !important',
            left: '0 !important',
          },
          '& #qr-reader__scan_region': {
            position: 'absolute !important',
            top: '0 !important',
            left: '0 !important',
            width: '100% !important',
            height: '100% !important',
            overflow: 'hidden !important',
          },
          // Hide the default viewfinder image
          '& #qr-reader__scan_region img': {
            display: 'none !important',
          },
          // Hide the shaded surround regions
          '& #qr-shaded-region': {
            display: 'none !important',
          },
          // Hide dashboard (file upload, etc.)
          '& #qr-reader__dashboard': {
            display: 'none !important',
          },
          '& #qr-reader__status_span': {
            display: 'none !important',
          },
          '& #qr-reader__header_message': {
            display: 'none !important',
          },
          // Hide any extra text spans the library adds
          '& #qr-reader > div:not(#qr-reader__scan_region)': {
            display: 'none !important',
          },
        }}
      >
        {/* The html5-qrcode target div */}
        <div id={containerId} />

        {/* Animated red scan line */}
        {cameraReady && (
          <Box
            sx={{
              position: 'absolute',
              left: '10%',
              width: '80%',
              height: '2px',
              backgroundColor: 'red',
              boxShadow: '0 0 8px 2px rgba(255, 0, 0, 0.6)',
              animation: `${scanLineAnimation} 2.5s ease-in-out infinite`,
              zIndex: 10,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-4px',
                left: 0,
                right: 0,
                height: '10px',
                background:
                  'linear-gradient(to bottom, rgba(255,0,0,0.15), transparent)',
              },
            }}
          />
        )}

        {/* Corner markers */}
        {cameraReady && (
          <>
            {/* Top-left */}
            <Box sx={{ position: 'absolute', top: 20, left: 40, zIndex: 10 }}>
              <Box
                sx={{ width: 24, height: 3, bgcolor: 'red', borderRadius: 1 }}
              />
              <Box
                sx={{ width: 3, height: 24, bgcolor: 'red', borderRadius: 1 }}
              />
            </Box>
            {/* Top-right */}
            <Box sx={{ position: 'absolute', top: 20, right: 40, zIndex: 10 }}>
              <Box
                sx={{
                  width: 24,
                  height: 3,
                  bgcolor: 'red',
                  borderRadius: 1,
                  ml: 'auto',
                }}
              />
              <Box
                sx={{
                  width: 3,
                  height: 24,
                  bgcolor: 'red',
                  borderRadius: 1,
                  ml: 'auto',
                }}
              />
            </Box>
            {/* Bottom-left */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 40,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column-reverse',
              }}
            >
              <Box
                sx={{ width: 24, height: 3, bgcolor: 'red', borderRadius: 1 }}
              />
              <Box
                sx={{ width: 3, height: 24, bgcolor: 'red', borderRadius: 1 }}
              />
            </Box>
            {/* Bottom-right */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 40,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column-reverse',
                alignItems: 'flex-end',
              }}
            >
              <Box
                sx={{ width: 24, height: 3, bgcolor: 'red', borderRadius: 1 }}
              />
              <Box
                sx={{ width: 3, height: 24, bgcolor: 'red', borderRadius: 1 }}
              />
            </Box>
          </>
        )}

        {/* Loading state before camera is ready */}
        {!cameraReady && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <Typography variant="body2" color="grey.400">
              Starting camera...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Scanning status indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: cameraReady ? 'red' : 'grey.400',
            animation: cameraReady ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1, transform: 'scale(1)' },
              '50%': { opacity: 0.4, transform: 'scale(1.3)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {cameraReady
            ? 'Scanning... Point your camera at a barcode or QR code'
            : 'Initializing camera...'}
        </Typography>
      </Box>
    </Box>
  )
}

export default QRScanner
