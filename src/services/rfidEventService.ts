import api from './api'

export const rfidEventService = {
  triggerManualEvent: (epc: string) =>
    api.post('/rfid-event', { EPC: epc, Type: 'Manual' }),
}

export default rfidEventService
