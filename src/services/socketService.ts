import { io, Socket } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
  'http://localhost:3000'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket?.id)
    })

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected')
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message)
    })
  }
  return socket
}

export const joinWorkOrder = (workOrderId: string) => {
  const s = getSocket()
  s.emit('join:workOrder', workOrderId)
}

export const leaveWorkOrder = (workOrderId: string) => {
  const s = getSocket()
  s.emit('leave:workOrder', workOrderId)
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export default { getSocket, joinWorkOrder, leaveWorkOrder, disconnectSocket }
