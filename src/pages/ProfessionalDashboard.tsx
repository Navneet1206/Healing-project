import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Appointment, Professional, Availability } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Edit, Plus } from 'lucide-react';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'availability'>('upcoming');

  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) return;

        // Fetch professional profile
        const { data: professionalData, error: professionalError } = await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (professionalError) throw professionalError;

        setProfessional(professionalData as Professional);

        // Fetch appointments
        if (professionalData) {
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              *,
              users:user_id (
                email,
                phone
              )
            `)
            .eq('professional_id', professionalData.id)
            .order('date', { ascending: true });

          if (appointmentsError) throw appointmentsError;

          setAppointments(appointmentsData as any);

          // Fetch availability
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('availability')
            .select('*')
            .eq('professional_id', professionalData.id)
            .order('day_of_week', { ascending: true });

          if (availabilityError) throw availabilityError;

          setAvailability(availabilityData as Availability[]);
        }
      } catch (err: any) {
        console.error('Error fetching professional data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [user]);

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      // Update local state
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status } 
          : appointment
      ));
    } catch (err: any) {
      console.error('Error updating appointment status:', err);
      setError(err.message || 'Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const upcomingAppointments = appointments.filter(
    appointment => new Date(`${appointment.date}T${appointment.endTime}`) >= new Date() && 
    appointment.status !== 'cancelled'
  );
  
  const pastAppointments = appointments.filter(
    appointment => new Date(`${appointment.date}T${appointment.endTime}`) < new Date() || 
    appointment.status === 'cancelled'
  );

  if (loading && !professional) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            You need to complete your professional profile before you can access the dashboard.
          </p>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Professional Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Professional Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your appointments, availability, and profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`${
                    activeTab === 'upcoming'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Upcoming Appointments ({upcomingAppointments.length})
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`${
                    activeTab === 'past'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Past Appointments ({pastAppointments.length})
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`${
                    activeTab === 'availability'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Manage Availability
                </button>
              </nav>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'upcoming' && (
                <>
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                      <p className="text-gray-600">
                        You don't have any upcoming appointments scheduled.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex flex-col sm:flex-row justify-between">
                            <div>
                              <div className="flex items-center mb-2">
                                <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                                <span className="font-medium">{formatDate(appointment.date)}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                                <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <User className="h-5 w-5 text-indigo-500 mr-2" />
                                <span>{(appointment as any).users.email}</span>
                              </div>
                              <div className="mb-2">
                                {getStatusBadge(appointment.status)}
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p className="font-medium">Notes:</p>
                                  <p>{appointment.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
                              {appointment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </button>
                                </>
                              )}
                              {appointment.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Completed
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'past' && (
                <>
                  {pastAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                      <p className="text-gray-600">
                        You don't have any past appointments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pastAppointments.map((appointment) => (
                        <div key={appointment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex flex-col sm:flex-row justify-between">
                            <div>
                              <div className="flex items-center mb-2">
                                <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                                <span className="font-medium">{formatDate(appointment.date)}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                                <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <User className="h-5 w-5 text-indigo-500 mr-2" />
                                <span>{(appointment as any).users.email}</span>
                              </div>
                              <div className="mb-2">
                                {getStatusBadge(appointment.status)}
                              </div>
                              {appointment.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p className="font-medium">Notes:</p>
                                  <p>{appointment.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'availability' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Your Availability</h3>
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Availability
                    </button>
                  </div>

                  {availability.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
                      <p className="text-gray-600 mb-4">
                        You haven't set your availability yet. Add your available time slots to start receiving appointments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const dayAvailability = availability.filter(a => a.dayOfWeek === day);
                        return (
                          <div key={day} className="border rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{getDayName(day)}</h4>
                              <button
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                            </div>
                            {dayAvailability.length === 0 ? (
                              <p className="text-gray-500 text-sm">Not available</p>
                            ) : (
                              <div className="space-y-2">
                                {dayAvailability.map((slot) => (
                                  <div key={slot.id} className="flex items-center text-sm">
                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                    {!slot.isAvailable && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        Unavailable
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1 text-sm text-gray-900">{professional.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Specialization</p>
                <p className="mt-1 text-sm text-gray-900">{professional.specialization}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hourly Rate</p>
                <p className="mt-1 text-sm text-gray-900">₹{professional.hourlyRate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Bio</p>
                <p className="mt-1 text-sm text-gray-900">{professional.bio}</p>
              </div>
            </div>
            <div className="mt-6">
              <button
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{appointments.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{upcomingAppointments.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {appointments.filter(a => a.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;