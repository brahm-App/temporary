"use client";
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

export default function Home() {
  const [vitals, setVitals] = useState({});
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [bluetoothStatus, setBluetoothStatus] = useState('Disconnected');
  const initialLength = 500;

  const [heartRateData, setHeartRateData] = useState({
    labels: Array.from({ length: initialLength }, (_, i) => i),
    values: Array(initialLength).fill(0),
  });

  useEffect(() => {
    const socket = io('http://localhost:8080'); // ✅ Adjust to match your backend

    socket.on('connect', () => {
      setStatus('connected');
      setError(null);
      console.log('Connected to server');
    });

    socket.on('vitals', (data) => {
      console.log('Received vitals data:', data);
      setVitals(data);

      const heartRate = data?.data?.ecg?.heartRate || 0;

      setHeartRateData((prev) => {
        const newValues = [...prev.values.slice(1), heartRate];
        return {
          labels: Array.from({ length: newValues.length }, (_, i) => i),
          values: newValues,
        };
      });
    });
    
    socket.on('bluetooth_status', (data) => {
      if (data.connected) {
        setBluetoothStatus('Connected');
      } else {
        setBluetoothStatus('Disconnected');
      }
    });

    socket.on('disconnect', () => {
      setStatus('error');
      setError('Disconnected from server');
    });

    socket.on('connect_error', () => {
      setStatus('error');
      setError('Connection failed');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const heartRateChartData = {
    labels: heartRateData.labels,
    datasets: [
      {
        label: 'Heart Rate',
        data: heartRateData.values,
        fill: false,
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      y: {
        beginAtZero: true,
        max: 200, // ✅ Suitable range for heart rate
        ticks: {
          stepSize: 20,
          callback: (value) => value.toLocaleString(),
        },
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
      x: {
        type: 'linear',
        min: 0,
        max: initialLength,
        ticks: {
          stepSize: 50,
          callback: (val) => val,
        },
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
    },
    plugins: {
      legend: { display: true },
    },
  };

  return (
    <div className="p-8 font-mono">
      <h1 className="text-2xl font-bold mb-4">🫁 Ventilator Monitor Dashboard</h1>
      <div className="bg-gray-100 p-6 rounded shadow mb-6">
        {status === 'connected' && <p className="text-green-500">Connected to server</p>}
        {status === 'error' && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="bg-gray-100 p-6 rounded shadow mb-6">
        <p><strong>Bluetooth Status:</strong> {bluetoothStatus}</p>
      </div>

      {/* Vitals */}
      <div className="bg-gray-100 p-6 rounded shadow mb-6">
        <p><strong>Heart Rate:</strong> {vitals?.data?.ecg?.heartRate || '--'} bpm</p>
        <p><strong>Respiratory Rate:</strong> {vitals?.data?.resp?.respirationRate || '--'} bpm</p>
        <p><strong>Oxygen Saturation:</strong> {vitals?.data?.spo2?.spo2Value || '--'}%</p>
        <p><strong>Airflow Pressure:</strong> {vitals?.airflow_pressure || '--'} cmH2O</p>
      </div>

      {/* Heart Rate Graph */}
      <div className="bg-white p-4 rounded shadow" style={{ height: '400px' }}>
        <Line data={heartRateChartData} options={chartOptions} />
      </div>
    </div>
  );
}
