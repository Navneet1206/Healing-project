import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Appointment, Payment } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CreditCard, ArrowLeft } from 'lucide-react';

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<boolean>(false);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || !user) return;

        // Fetch appointment details
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', id)
          .single();

        if (appointmentError) throw appointmentError;
        
        // Check if user has permission to view this appointment
        if (user.role === 'user' && appointmentData.user_id !== user.id) {
          throw new Error('You do not have permission to view this appointment');
        }
        
        if (user.role === 'professional') {
          // Check if the professional is associated with this appointment
          const { data: professionalData } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (professionalData && appointmentData.professional_id !== professionalData.id) {
            throw new Error('You do not have permission to view this appointment');
          }
        }

        setAppointment(appointmentData as Appointment);

        // Fetch professional details
        const { data: professionalData, error: professionalError } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', appointmentData.professional_id)
          .single();

        if (professionalError) throw professionalError;
        setProfessional(professionalData);

        // Fetch payment details if available
        if (appointmentData.payment_id) {
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', appointmentData.payment_id)
            .single();

          if (paymentError) throw paymentError;
          setPayment(paymentData as Payment);
        }
      } catch (err: any) {
        console.error('Error fetching appointment details:', err);
        setError(err.message || 'Failed to fetch appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [id, user]);

  const cancelAppointment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!appointment) return;

      // Update appointment status to cancelled
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // Update local state
      setAppointment({
        ...appointment,
        status: 'cancelled'
      });

      setCancelConfirm(false);
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!appointment || !professional) return;

      // In a real app, this would create a Razorpay order and redirect to payment
      alert('In a real app, this would redirect to Razorpay payment gateway');
      
      // For demo purposes, we'll simulate a successful payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            appointment_id: appointment.id,
            user_id: user?.id,
            amount: professional.hourly_rate,
            currency: 'INR',
            status: 'completed',
            payment_method: 'card',
            transaction_id: `DEMO-${Date.now()}`
          }
        ])
        .select()
        .single();
        
      if (paymentError) throw paymentError;
      
      // Update appointment with payment ID
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          payment_id: paymentData.id,
          status: 'confirmed'
        })
        .eq('id', appointment.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setPayment(paymentData as Payment);
      setAppointment({
        ...appointment,
        paymentId: paymentData.id,
        status: 'confirmed'
      });
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setError(err.message || 'Failed to initiate payment');
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
            <AlertCircle className="h-4 w-4 mr-1" />
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!appointment || !professional) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Appointment not found</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Appointment with {professional.name}
                </h2>
                <p className="text-gray-500">{professional.specialization}</p>
              </div>
            </div>
            <div>
              {getStatusBadge(appointment.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-gray-900">{formatDate(appointment.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="text-gray-900">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Professional</p>
                    <p className="text-gray-900">{professional.name}</p>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-gray-900 mt-1">{appointment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              {payment ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Status</p>
                      <p className="text-green-600 font-medium">Paid</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-5 w-5 text-indigo-500 mr-3 flex items-center justify-center">₹</div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-gray-900 capitalize">{payment.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                      <p className="text-gray-900">{payment.transactionId}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    {appointment.status === 'cancelled' 
                      ? 'This appointment has been cancelled.'
                      : 'Payment is required to confirm this appointment.'}
                  </p>
                  {appointment.status !== 'cancelled' && (
                    <div className="bg-indigo-50 p-4 rounded-md mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Session Fee</span>
                        <span className="font-semibold">{formatCurrency(professional.hourly_rate)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Taxes</span>
                        <span className="font-semibold">{formatCurrency(professional.hourly_rate * 0.18)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-indigo-100">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">{formatCurrency(professional.hourly_rate * 1.18)}</span>
                      </div>
                    </div>
                  )}
                  {appointment.status === 'pending' && (
                    <button
                      onClick={initiatePayment}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between">
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <div>
                  {cancelConfirm ? (
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-red-600">Are you sure you want to cancel?</p>
                      <button
                        onClick={cancelAppointment}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Yes, Cancel
                      </button>
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        No, Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;