import { io } from 'socket.io-client'

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const socket = io(API_ROOT, {
  auth: { token: localStorage.getItem('token') },
  autoConnect: false
})

export const connectSocket = (token = localStorage.getItem('token')) => {
  socket.auth = { token }

  if (!socket.connected) {
    socket.connect()
  }
}

export const connectAdminSocket = connectSocket

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

export default socket
