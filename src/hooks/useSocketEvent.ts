import { useEffect, useRef } from 'react'
import { getSocket } from '../services/socketService'

export const useSocketEvent = <T = unknown>(
  eventName: string,
  callback: (data: T) => void,
  enabled: boolean = true
) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const socket = getSocket()

    const handler = (data: T) => {
      callbackRef.current(data)
    }

    socket.on(eventName, handler as (...args: unknown[]) => void)

    return () => {
      socket.off(eventName, handler as (...args: unknown[]) => void)
    }
  }, [eventName, enabled])
}

export default useSocketEvent
