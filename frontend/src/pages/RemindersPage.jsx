import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../utils/apiClient';

const RemindersPage = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const [formData, setFormData] = useState({
    reminder_type: 'medicine',
    title: '',
    description: '',
    family_member_id: '',
    reminder_time: '09:00',
    reminder_days: ['daily'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  const reminderTypes = [
    { value: 'medicine', label: 'Medicine' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'checkup', label: 'Checkup' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'exercise', label: 'Exercise' },
    { value: 'other', label: 'Other' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ];

  useEffect(() => {
    loadData();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Notifications enabled! 🔔');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
      }
    } else {
      toast.error('Your browser doesn\'t support notifications');
    }
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('MediLink Reminder Test', {
        body: 'This is a test notification! Your reminders will look like this. 💊',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification'
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Please enable notifications first');
    }
  };

  const loadData = async () => {
    try {
      const [remindersRes, membersRes] = await Promise.all([
        apiClient.get('/reminders'),
        apiClient.get('/family-members')
      ]);
      
      setReminders(remindersRes.data.reminders || []);
      setFamilyMembers(membersRes.data.familyMembers || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      toast.error('Please log in to create reminders');
      navigate('/login');
      return;
    }
    
    // Validate custom days selection
    if (!formData.reminder_days.includes('daily') && formData.reminder_days.length === 0) {
      toast.error('Please select at least one day of the week');
      return;
    }
    
    try {
      // Prepare data - convert empty string to null for family_member_id
      const submitData = {
        ...formData,
        family_member_id: formData.family_member_id || null,
        end_date: formData.end_date || null
      };
      
      console.log('===== CREATING REMINDER =====');
      console.log('Submitting reminder data:', submitData);
      console.log('API URL:', 'http://localhost:5000/api/reminders');
      
      const response = await apiClient.post('/reminders', submitData);
      
      console.log('===== SUCCESS =====');
      console.log('Reminder created successfully:', response.data);
      toast.success('Reminder created successfully! 🎉');
      setShowAddForm(false);
      setFormData({
        reminder_type: 'medicine',
        title: '',
        description: '',
        family_member_id: '',
        reminder_time: '09:00',
        reminder_days: ['daily'],
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      loadData();
    } catch (error) {
      console.log('===== ERROR =====');
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMsg = error.response?.data?.error || error.message || 'Failed to create reminder';
        console.error('Showing error toast:', errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiClient.patch(`/reminders/${id}/toggle`);
      toast.success('Reminder updated');
      loadData();
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      await apiClient.delete(`/reminders/${id}`);
      toast.success('Reminder deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const handleDayToggle = (day) => {
    if (formData.reminder_days.includes('daily')) {
      // If daily is selected, switch to specific days
      setFormData({
        ...formData,
        reminder_days: [day]
      });
    } else {
      // Toggle the specific day
      if (formData.reminder_days.includes(day)) {
        const newDays = formData.reminder_days.filter(d => d !== day);
        setFormData({
          ...formData,
          reminder_days: newDays.length === 0 ? ['daily'] : newDays
        });
      } else {
        setFormData({
          ...formData,
          reminder_days: [...formData.reminder_days, day]
        });
      }
    }
  };

  const setDailyReminder = () => {
    setFormData({
      ...formData,
      reminder_days: ['daily']
    });
  };

  const getReminderTypeLabel = (type) => {
    const reminderType = reminderTypes.find(t => t.value === type);
    return reminderType ? reminderType.label : 'Other';
  };

  const getReminderTypeIcon = (type) => {
    switch(type) {
      case 'medicine': return '💊';
      case 'appointment': return '📅';
      case 'checkup': return '🩺';
      case 'exercise': return '🏃';
      case 'diet': return '🥗';
      case 'other': return '📌';
      default: return '🔔';
    }
  };

  const formatDays = (days) => {
    if (days.includes('daily')) return 'Daily';
    if (days.length === 7) return 'Every day';
    if (days.length === 1) return days[0].charAt(0).toUpperCase() + days[0].slice(1);
    return `${days.length} days/week`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-blue-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-black hover:text-gray-700 font-medium flex items-center">
                <span className="text-lg mr-2">←</span> Back
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔔</span>
                <h1 className="text-xl md:text-2xl font-bold text-black">
                  Reminders
                </h1>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-3 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center space-x-2"
              style={{ 
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <span>➕</span>
              <span>Add Reminder</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Notification Permission Banner */}
        {notificationPermission !== 'granted' && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🔔</span>
                <div>
                  <p className="font-semibold text-black flex items-center">
                    Enable Notifications
                  </p>
                  <p className="text-sm text-black">
                    To receive reminders, please enable browser notifications
                  </p>
                </div>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium whitespace-nowrap flex items-center space-x-2"
              >
                <span>✓</span>
                <span>Enable Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Add Reminder Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold" style={{ color: '#000000', fontWeight: 'bold' }}>Add New Reminder</h2>
                <p className="text-sm mt-1" style={{ color: '#000000' }}>Set up a reminder for medicine, appointments, or checkups</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Reminder Type */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Reminder Type *</label>
                  <select
                    value={formData.reminder_type}
                    onChange={(e) => setFormData({...formData, reminder_type: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black bg-white shadow-sm"
                    required
                  >
                    {reminderTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Take Aspirin, Doctor Appointment"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black shadow-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g., 100mg after breakfast"
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black shadow-sm resize-none"
                  />
                </div>

                {/* Family Member */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">For Family Member (Optional)</label>
                  <select
                    value={formData.family_member_id}
                    onChange={(e) => setFormData({...formData, family_member_id: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black bg-white shadow-sm"
                  >
                    <option value="">Myself</option>
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Reminder Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.reminder_time}
                    onChange={(e) => setFormData({...formData, reminder_time: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black shadow-sm"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">Frequency *</label>
                  <select
                    value={formData.reminder_days.includes('daily') ? 'daily' : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'daily') {
                        setFormData({...formData, reminder_days: ['daily']});
                      } else {
                        setFormData({...formData, reminder_days: []});
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black bg-white shadow-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="custom">Select Specific Days</option>
                  </select>

                  {/* Show day selector only if custom is selected */}
                  {!formData.reminder_days.includes('daily') && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Select days of the week:</p>
                      <div className="grid grid-cols-7 gap-2">
                        {daysOfWeek.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleDayToggle(day.value)}
                            className={`p-2 rounded-lg text-xs font-medium transition-all ${
                              formData.reminder_days.includes(day.value)
                                ? 'bg-blue-600 text-white border-2 border-blue-600'
                                : 'bg-white text-black border-2 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                      {formData.reminder_days.length === 0 && (
                        <p className="text-xs text-red-600 mt-2">Please select at least one day</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      min={formData.start_date}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-black shadow-sm"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-8 py-3 rounded-lg transition-all duration-200 text-sm font-semibold"
                    style={{ 
                      backgroundColor: '#6b7280',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-3 rounded-lg transition-all duration-200 text-sm font-semibold"
                    style={{ 
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    Create Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-black mb-2">No Reminders Yet</h3>
            <p className="text-black">
              Click "Add Reminder" button above to create your first reminder
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map(reminder => (
              <div
                key={reminder.id}
                className={`bg-white rounded-xl shadow-md border-2 p-5 transition-all ${
                  reminder.is_active ? 'border-blue-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-4xl">
                      {getReminderTypeIcon(reminder.reminder_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-black text-lg">{reminder.title}</h4>
                      {reminder.description && (
                        <p className="text-sm text-black mt-1">{reminder.description}</p>
                      )}
                      <div className="flex items-start space-x-8 mt-3 text-sm text-black">
                        <div className="flex flex-col">
                          <span className="font-bold mb-1">Time:</span>
                          <span>{reminder.reminder_time}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold mb-1">Frequency:</span>
                          <span>{formatDays(reminder.reminder_days)}</span>
                        </div>
                        {reminder.family_member_name && (
                          <div className="flex flex-col">
                            <span className="font-bold mb-1">For:</span>
                            <span>{reminder.family_member_name}</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold mb-1">Type:</span>
                          <span>{getReminderTypeLabel(reminder.reminder_type)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggle(reminder.id)}
                      className="px-6 py-2 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center space-x-2"
                      style={{ 
                        backgroundColor: reminder.is_active ? '#10b981' : '#6b7280',
                        color: '#ffffff',
                        boxShadow: reminder.is_active 
                          ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                          : '0 2px 8px rgba(107, 114, 128, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = reminder.is_active ? '#059669' : '#4b5563';
                        e.currentTarget.style.boxShadow = reminder.is_active 
                          ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                          : '0 4px 12px rgba(107, 114, 128, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = reminder.is_active ? '#10b981' : '#6b7280';
                        e.currentTarget.style.boxShadow = reminder.is_active 
                          ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                          : '0 2px 8px rgba(107, 114, 128, 0.3)';
                      }}
                    >
                      <span>{reminder.is_active ? '✓' : '⏸'}</span>
                      <span>{reminder.is_active ? 'Active' : 'Paused'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="px-6 py-2 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center space-x-2"
                      style={{ 
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                      }}
                      title="Delete"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default RemindersPage;
