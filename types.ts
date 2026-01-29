
export type UserRole = 'Admin' | 'Viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface RecognitionEvent {
  id: string;
  timestamp: string;
  cameraId: string;
  label: string; // Employee Name or "Intruder"
  isEmployee: boolean;
  confidence: number;
  imageUrl?: string;
}

export interface Employee {
  id: string;
  name: string;
  totalHours: number;
  daysPresent: number;
  lastDetected: string;
  confidenceTrend: number[];
  recentActivity: { time: string; action: string }[];
}

export interface CameraStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastSeen: string;
  detectionsToday: number;
  area: string; // Added area for categorization
}

export interface FootprintData {
  hour: string;
  count: number;
}

export interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down';
  mlModel: 'ready' | 'loading' | 'error';
  analysis: 'active' | 'idle' | 'paused';
  version: string;
}
