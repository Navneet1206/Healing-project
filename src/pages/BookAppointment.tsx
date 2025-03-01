import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BookAppointmentFormData, Professional } from '../types';
import { Calendar, Clock, CreditCard, User } from 'lucide-react';

const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookAppointmentFormData>();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  
  const selectedProfessionalId = watch('professionalId');
  const selectedDate = watch('date');

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('professionals')
          .select('*');
          
        if (error) throw error;
        
        setProfessionals(data as Professional[]);
      } catch (err: any) {
        console.error('Error fetching professionals:', err);
        setError(err.message || 'Failed to fetch professionals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfessionals();
  }, []);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedProfessionalId || !selectedDate) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the day of week (0-6) from the selected date
        const dayOfWeek = new Date(selectedDate).getDay();
        
        // Fetch the professional's availability for this day of week
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('availability')
          .select('*')
          .eq('professional_id', selectedProfessionalId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true);
          
        if (availabilityError) throw availabilityError;
        
        // Fetch existing appointments for this professional on this date
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('professional_id', selectedProfessionalId)
          .eq('date', selectedDate)
          .not('status', 'eq', 'cancelled');
          
        if (appointmentsError) throw appointmentsError;
        
        // Generate available time slots based on availability and existing appointments
        // This is a simplified version - in a real app, you would need more complex logic
        const slots = [];
        
        if (availabilityData && availabilityData.length > 0) {
          const availability = availabilityData[0];
          const startTime = new Date(`1970-01-01T${availability.start_time}`);
          const endTime = new Date(`1970-01-01T${availability.end_time}`);
          
          // Generate 1-hour slots
          const slotDuration = 60 * 60 * 1000; // 1 hour in milliseconds
          
          for (let time = startTime.getTime(); time < endTime.getTime(); time += slotDuration) {
            const slotStart = new Date(time);
            const slotEnd = new Date(time + slotDuration);
            
            // Format times as HH:MM
            const formattedStart = slotStart.toTimeString().substring(0, 5);
            const formattedEnd = slotEnd.toTimeString().substring(0, 5);
            
            // Check if this slot overlaps with any existing appointment
            const isBooked = appointmentsData?.some(appointment => {
              const apptStart = appointment.start_time;
              const apptEnd = appointment.end_time;
              
              return (
                (formattedStart >= apptStart && formattedStart < apptEnd) ||
                (formattedEnd > apptStart && formattedEnd <= apptEnd) ||
                (formattedStart <= apptStart && formattedEnd >= apptEnd)
              );
            });
            
            if (!isBooked) {
              slots.push({
                startTime: formattedStart,
                endTime: formattedEnd
              });
            }
          }
        }
        
        setAvailableSlots(slots);
      } catch (err: any) {
        console.error('Error fetching available slots:', err);
        setError(err.message || 'Failed to fetch available slots');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableSlots();
  }, [selectedProfessionalId, selectedDate]);

  const onSubmit = async (data: BookAppointmentFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create the appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            user_id: user.id,
            professional_id: data.professionalId,
            date: data.date,
            start_time: data.startTime,
            end_time: data.endTime,
            notes: data.notes,
            status: 'pending'
          }
        ])
        .select();
        
      if (appointmentError) throw appointmentError;
      
      // In a real app, you would redirect to payment page here
      // For now, we'll just redirect to the dashboard
      navigate('/dashboard', { state: { appointmentCreated: true } });
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="mt-2 text-gray-600">
          Schedule a session with one of our healthcare professionals.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
                Select a Professional
              </label>
              <div className="mt-1">
                <select
                  id="professionalId"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  {...register('professionalId', { required: 'Please select a professional' })}
                >
                  <option value="">Select a professional</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name} - {professional.specialization}
                    </option>
                  ))}
                </select>
                {errors.professionalId && (
                  <p className="mt-2 text-sm text-red-600">{errors.professionalId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Select a Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="date"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                  {...register('date', { required: 'Please select a date' })}
                />
              </div>
              {errors.date && (
                <p className="mt-2 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {selectedProfessionalId && selectedDate && (
              <div>
                <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
                  Select a Time Slot
                </label>
                <div className="mt-1">
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No available slots for this date. Please select another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((slot, index) => (
                        <div key={index} className="relative">
                          <input
                            type="radio"
                            id={`slot-${index}`}
                            value={index}
                            className="sr-only"
                            {...register('startTime', { required: 'Please select a time slot' })}
                            onChange={() => {
                              // This is a workaround to set both start and end time when a slot is selected
                              const { setValue } = require('react-hook-form');
                              setValue('startTime', slot.startTime);
                              setValue('endTime', slot.endTime);
                            }}
                          />
                          <label
                            htmlFor={`slot-${index}`}
                            className="flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 focus:outline-none"
                          >
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.startTime && (
                    <p className="mt-2 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any specific concerns or information you'd like to share..."
                  {...register('notes')}
                ></textarea>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Payment Information</h3>
                  <p className="text-sm text-gray-500">
                    You will be redirected to our secure payment gateway after booking your appointment.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || availableSlots.length === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;