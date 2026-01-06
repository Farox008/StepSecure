
import { api } from './api';
import { db } from './db';
import { RecognitionEvent } from './types';

export const startSimulator = (onNewEvent: (e: RecognitionEvent) => void) => {
  const interval = setInterval(() => {
    const cameras = db.getCameras().filter(c => c.status === 'online');
    const employees = db.getEmployees();
    
    if (cameras.length === 0) return;

    // Pick a random camera
    const camera = cameras[Math.floor(Math.random() * cameras.length)];
    
    // 85% chance it's a known employee
    const isEmployee = Math.random() > 0.15;
    const employee = isEmployee ? employees[Math.floor(Math.random() * employees.length)] : null;

    const newEvent: RecognitionEvent = {
      id: 'evt-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      cameraId: camera.id,
      label: isEmployee ? employee?.name || 'Unknown' : 'INTRUDER ALERT',
      isEmployee: isEmployee,
      confidence: 0.85 + Math.random() * 0.14,
    };

    api.pushEvent(newEvent);
    
    // Also update traffic analytics for current hour
    const hour = new Date().getHours().toString().padStart(2, '0') + ':00';
    api.updateTraffic(hour, 1);

    onNewEvent(newEvent);

    // Increment camera detections
    const allCams = db.getCameras();
    const updatedCams = allCams.map(c => c.id === camera.id ? { ...c, detectionsToday: c.detectionsToday + 1 } : c);
    db.saveCameras(updatedCams);

  }, 10000); // New event and traffic update every 10 seconds

  return () => clearInterval(interval);
};
