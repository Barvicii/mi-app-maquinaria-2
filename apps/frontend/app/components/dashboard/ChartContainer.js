'use client';

import React from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useState } from 'react';
import { UserPlus, X, Send, Loader2 } from 'lucide-react';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartContainer({ title, subtitle, icon, chartType, data, height = 250 }) {
  // Opciones predeterminadas
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };
  
  // Colores predefinidos para los gráficos
  const backgroundColors = [
    'rgba(59, 130, 246, 0.5)', // blue-500
    'rgba(16, 185, 129, 0.5)', // green-500
    'rgba(245, 158, 11, 0.5)', // amber-500
    'rgba(139, 92, 246, 0.5)', // purple-500
    'rgba(239, 68, 68, 0.5)',  // red-500
    'rgba(236, 72, 153, 0.5)', // pink-500
  ];
  
  const borderColors = [
    'rgba(59, 130, 246, 1)', // blue-500
    'rgba(16, 185, 129, 1)', // green-500
    'rgba(245, 158, 11, 1)', // amber-500
    'rgba(139, 92, 246, 1)', // purple-500
    'rgba(239, 68, 68, 1)',  // red-500
    'rgba(236, 72, 153, 1)', // pink-500
  ];

  // Procesar datos según el tipo de gráfico
  const getChartData = () => {
    if (!data || data.length === 0) {
      // Datos de ejemplo si no hay datos reales
      return {
        labels: ['No data'],
        datasets: [
          {
            label: 'No data available',
            data: [0],
            backgroundColor: backgroundColors[0],
            borderColor: borderColors[0],
            borderWidth: 1,
          },
        ],
      };
    }

    switch (chartType) {
      case 'line':
        // Para gráfico de línea (actividad mensual)
        return {
          labels: data.map(item => item.label),
          datasets: data.map((dataset, index) => ({
            label: dataset.name,
            data: dataset.values,
            backgroundColor: backgroundColors[index % backgroundColors.length],
            borderColor: borderColors[index % borderColors.length],
            borderWidth: 2,
            tension: 0.4,
            fill: false,
          })),
        };
      
      case 'bar':
        // Para gráfico de barras
        return {
          labels: data.map(item => item.label),
          datasets: [{
            label: title,
            data: data.map(item => item.value),
            backgroundColor: data.map((_, index) => 
              backgroundColors[index % backgroundColors.length]
            ),
            borderColor: data.map((_, index) => 
              borderColors[index % borderColors.length]
            ),
            borderWidth: 1,
          }],
        };
      
      case 'pie':
        // Para gráfico circular (distribución por departamento)
        return {
          labels: data.map(item => item.label),
          datasets: [{
            data: data.map(item => item.value),
            backgroundColor: data.map((_, index) => 
              backgroundColors[index % backgroundColors.length]
            ),
            borderColor: data.map((_, index) => 
              borderColors[index % borderColors.length]
            ),
            borderWidth: 1,
          }],
        };
      
      default:
        // Por defecto, retornar datos para gráfico de línea
        return {
          labels: data.map(item => item.label),
          datasets: [
            {
              label: title,
              data: data.map(item => item.value),
              backgroundColor: backgroundColors[0],
              borderColor: borderColors[0],
              borderWidth: 2,
              tension: 0.4,
            },
          ],
        };
    }
  };

  // Renderizar el tipo de gráfico apropiado
  const renderChart = () => {
    const chartData = getChartData();
    
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} height={height} />;
      case 'bar':
        return <Bar data={chartData} options={options} height={height} />;
      case 'pie':
        return <Pie data={chartData} options={options} height={height} />;
      default:
        return <Line data={chartData} options={options} height={height} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="p-6" style={{ height: `${height}px` }}>
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No data available to display</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function InviteUserButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'USER',
    message: '',
    sendEmail: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la invitación');
      }
      
      setSuccess(true);
      setFormData({
        email: '',
        name: '',
        role: 'USER',
        message: '',
        sendEmail: true
      });
      
      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        <UserPlus size={16} className="mr-2" />
        Invite User
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserPlus size={20} className="mr-2 text-blue-600" />
              Invite New User
            </h2>
            
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <p className="text-green-700 flex items-center">
                  <Send size={16} className="mr-2" />
                  Invitation sent successfully
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="User name"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Custom message for invitation"
                  ></textarea>
                </div>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
                    Send invitation email
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Envía email de invitación a un nuevo usuario
 * @param {Object} options - Opciones de la invitación
 * @param {string} options.email - Email del destinatario
 * @param {string} options.name - Nombre del destinatario (opcional)
 * @param {string} options.inviteCode - Código de invitación
 * @param {string} options.message - Mensaje personalizado (opcional)
 * @param {string} options.inviterName - Nombre de quien invita
 * @param {string} options.role - Rol asignado
 * @returns {Promise} - Promesa con el resultado del envío
 */
export async function sendInvitationEmail({ email, name = '', inviteCode, message = '', inviterName = 'El equipo', role = 'Usuario' }) {
  const subject = 'Invitation to join Orchard Service';
  const registrationUrl = `${process.env.NEXTAUTH_URL || 'https://your-site.com'}/register?inviteCode=${inviteCode}&email=${encodeURIComponent(email)}`;
  
  // Convert role to friendly English name
  const roleName = 
    role === 'ADMIN' ? 'Administrator' :
    role === 'MANAGER' ? 'Manager' :
    role === 'ACCOUNTANT' ? 'Accountant' :
    role === 'TECHNICIAN' ? 'Technician' :
    'User';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <img src="${process.env.NEXTAUTH_URL || 'https://your-site.com'}/Imagen/logoo.png" alt="Orchard Service" style="max-width: 150px; margin-bottom: 20px;">      <h2 style="color: #4F46E5;">Invitation to Orchard Service</h2>
      <p>Hello ${name || 'there'},</p>
      <p>${inviterName} has invited you to join <strong>Orchard Service</strong> with the role of <strong>${roleName}</strong>.</p>

      ${message ? `<p style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #4F46E5;"><em>"${message}"</em></p>` : ''}
      
      <p>Orchard Service is a machinery management platform that will allow you to efficiently manage and maintain control of your equipment.</p>
      
      <p>To accept this invitation, click on the following button:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${registrationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Create my account
        </a>
      </div>
      
      <p style="color: #6B7280; font-size: 14px;">This invitation will expire in 7 days. If the link doesn't work, copy and paste the following address in your browser:</p>
      <p style="word-break: break-all; color: #6B7280; font-size: 14px;">${registrationUrl}</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 0.8em; color: #666;">
          If you received this email by mistake, please ignore it. This invitation can only be used with the email it was sent to.
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail({ to: email, subject, html });
}