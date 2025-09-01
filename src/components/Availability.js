import React, { useState, useEffect } from 'react';
import { bedsAPI } from '../services/api';

function Availability({ onBack, beds, setBeds }) {
  const [selectedBed, setSelectedBed] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    time: ''
  });
  const [loading, setLoading] = useState({
    initialize: false,
    booking: false,
    unbooking: false,
    general: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Function to convert 24-hour time to 12-hour format for display
  const convertTo12Hour = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return timeStr;

    const [hour, minute] = timeStr.split(':');
    let hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    hourInt = hourInt % 12;
    hourInt = hourInt ? hourInt : 12; // 0 becomes 12
    return `${hourInt}:${minute} ${ampm}`;
  };

  // Initialize beds if they don't exist and fetch data periodically
  useEffect(() => {
    if (beds.length === 0) {
      initializeBeds();
    }

    // Set up interval to sync with database every 30 seconds
    const syncInterval = setInterval(fetchBedsData, 30000);
    
    return () => clearInterval(syncInterval);
  }, []);

  const fetchBedsData = async () => {
    try {
      const bedsData = await bedsAPI.getAll();
      setBeds(bedsData);
    } catch (error) {
      console.error('Error fetching beds data:', error);
    }
  };

  const initializeBeds = async () => {
    try {
      setLoading(prev => ({ ...prev, initialize: true }));
      setError('');
      await bedsAPI.initialize();
      await fetchBedsData();
      setSuccess('Beds initialized successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to initialize beds. Please try again.');
      console.error('Error initializing beds:', error);
    } finally {
      setLoading(prev => ({ ...prev, initialize: false }));
    }
  };

  const handleBedClick = async (bed) => {
    if (bed.isBooked) {
      // Unbook the bed
      try {
        setLoading(prev => ({ ...prev, unbooking: true }));
        setError('');
        await bedsAPI.unbook(bed.id);
        
        // Fetch fresh data from database to ensure sync
        await fetchBedsData();
        
        setSuccess(`Bed ${bed.id} unbooked successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.message || 'Failed to unbook bed. Please try again.');
        console.error('Error unbooking bed:', error);
      } finally {
        setLoading(prev => ({ ...prev, unbooking: false }));
      }
    } else {
      // Select bed for booking
      setSelectedBed(bed);
      setBookingForm({ patientName: '', time: '' });
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!bookingForm.patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    
    if (!bookingForm.time) {
      setError('Time is required');
      return;
    }

    setLoading(prev => ({ ...prev, booking: true }));
    setError('');

    try {
      await bedsAPI.book(selectedBed.id, bookingForm);
      
      // Fetch fresh data from database to ensure sync
      await fetchBedsData();
      
      setSelectedBed(null);
      setBookingForm({ patientName: '', time: '' });
      setSuccess(`Bed ${selectedBed.id} booked successfully for ${bookingForm.patientName}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to book bed. Please try again.');
      console.error('Error booking bed:', error);
    } finally {
      setLoading(prev => ({ ...prev, booking: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm({ ...bookingForm, [name]: value });
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const cancelBooking = () => {
    setSelectedBed(null);
    setBookingForm({ patientName: '', time: '' });
    setError('');
  };

  const availableBeds = beds.filter(bed => !bed.isBooked).length;
  const bookedBeds = beds.filter(bed => bed.isBooked).length;

  const isLoading = loading.initialize || loading.booking || loading.unbooking;

  return (
    <div className="availability-container">
      <header className="availability-header">
        <button onClick={onBack} className="back-button" disabled={isLoading}>
          ← Back to Dashboard
        </button>
        <h1>Bed Availability</h1>
      </header>
      
      <div className="availability-content">
        <div className="bed-selection-section">
          <h2>Bed Selection</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}
          
          {loading.initialize ? (
            <div className="loading">Initializing beds...</div>
          ) : (
            <div className="bed-grid">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className={`bed ${bed.isBooked ? 'booked' : 'available'} ${selectedBed?.id === bed.id ? 'selected' : ''}`}
                  onClick={() => !isLoading && handleBedClick(bed)}
                >
                  <div className="bed-number">{bed.id}</div>
                  {bed.isBooked && (
                    <div className="bed-info">
                      <div className="patient-name">{bed.patientName}</div>
                      <div className="booking-time">{convertTo12Hour(bed.time)}</div>
                    </div>
                  )}
                  {loading.unbooking && selectedBed?.id === bed.id && (
                    <div className="loading-overlay">Unbooking...</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="bed-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color booked"></div>
              <span>Booked</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
        
        <div className="booking-form-section">
          <h2>Bed Booking</h2>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">{availableBeds}</span>
              <span className="stat-label">Available Beds</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{bookedBeds}</span>
              <span className="stat-label">Booked Beds</span>
            </div>
          </div>
          
          {selectedBed && (
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <h3>Book Bed {selectedBed.id}</h3>
              <div className="form-group">
                <label>Patient Name:</label>
                <input
                  type="text"
                  name="patientName"
                  value={bookingForm.patientName}
                  onChange={handleInputChange}
                  required
                  disabled={loading.booking}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="form-group">
                <label>Time:</label>
                <input
                  type="time"
                  name="time"
                  value={bookingForm.time}
                  onChange={handleInputChange}
                  required
                  disabled={loading.booking}
                />
              </div>
              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={loading.booking || !bookingForm.patientName.trim() || !bookingForm.time}
                >
                  {loading.booking ? 'Booking...' : 'Book Bed'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={cancelBooking}
                  disabled={loading.booking}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="booked-beds-list">
            <h3>Currently Booked Beds</h3>
            <div className="booked-beds">
              {beds.filter(bed => bed.isBooked).length === 0 ? (
                <div className="no-bookings-message">No beds are currently booked</div>
              ) : (
                beds.filter(bed => bed.isBooked).map(bed => (
                  <div key={bed.id} className="booked-bed-item">
                    <span className="bed-number">Bed {bed.id}</span>
                    <span className="patient-name">{bed.patientName}</span>
                    <span className="booking-time">{convertTo12Hour(bed.time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Availability;
