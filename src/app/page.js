// frontend/pages/index.js
"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [vitals, setVitals] = useState({});
  const [status, setStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      setStatus('connected');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setVitals(data);
      } catch (err) {
        console.error('Error parsing data:', err);
        setError('Invalid data received');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      setError('Connection error');
    };

    socket.onclose = () => {
      setStatus('error');
      setError('Connection closed');
    };

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="p-8 font-mono">
      <h1 className="text-2xl font-bold mb-4">🫁 Ventilator Monitor Dashboard</h1>
      
      {/* Connection Status */}
      <div className={`mb-4 p-2 rounded ${
        status === 'connected' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        Status: {status === 'connected' ? 'Connected' : error || 'Connecting...'}
      </div>

      {/* Vitals Display */}
      <div className="bg-gray-100 p-6 rounded shadow">
        <p><strong>Respiratory Rate:</strong> {vitals.respiratory_rate || '--'} bpm</p>
        <p><strong>Oxygen Saturation:</strong> {vitals.oxygen_saturation || '--'}%</p>
        <p><strong>Airflow Pressure:</strong> {vitals.airflow_pressure || '--'} cmH2O</p>
      </div>
    </div>
  );
}
