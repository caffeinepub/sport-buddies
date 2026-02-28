import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Plane } from 'lucide-react';
import { useHelicopterAvailability } from '@/hooks/useHelicopterAvailability';
import { useHelicopterBooking } from '@/hooks/useHelicopterBooking';
import { useCoinBalance } from '@/hooks/useCoinBalance';

const COIN_COST = 2000;
const DEFAULT_DURATION_MINUTES = 20;

export default function HelicopterPage() {
  const navigate = useNavigate();
  const { balance, updateBalance } = useCoinBalance();
  const bookingMutation = useHelicopterBooking();

  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [totalWeight, setTotalWeight] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [availabilityCheckParams, setAvailabilityCheckParams] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    date: string;
    time: string;
    paymentMode: string;
  } | null>(null);

  // Calculate start and end times
  const getStartEndTimes = () => {
    if (!date || !time) return null;
    
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + DEFAULT_DURATION_MINUTES * 60000);
    
    return {
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
    };
  };

  // Availability query
  const { data: availabilityData, isLoading: isCheckingAvailability, error: availabilityError } = 
    useHelicopterAvailability(
      availabilityCheckParams?.start || '',
      availabilityCheckParams?.end || '',
      !!availabilityCheckParams
    );

  const handleCheckAvailability = () => {
    const times = getStartEndTimes();
    if (!times) return;

    setAvailabilityCheckParams(times);
    setHasCheckedAvailability(true);
  };

  const isSlotAvailable = () => {
    if (!hasCheckedAvailability || !availabilityData) return false;
    if (availabilityData.error) return false;
    
    const times = getStartEndTimes();
    if (!times) return false;

    // Check if requested slot conflicts with any busy blocks
    const requestStart = new Date(times.start);
    const requestEnd = new Date(times.end);

    for (const busy of availabilityData.busy) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      // Check for overlap
      if (requestStart < busyEnd && requestEnd > busyStart) {
        return false;
      }
    }

    return true;
  };

  const isFormValid = () => {
    return (
      date &&
      time &&
      name.trim() &&
      email.trim() &&
      phone.trim() &&
      passengerCount &&
      parseInt(passengerCount) >= 1 &&
      parseInt(passengerCount) <= 2 &&
      totalWeight.trim() &&
      parseFloat(totalWeight) > 0
    );
  };

  const handleBooking = async (paymentMode: 'paid' | 'coins') => {
    if (!isFormValid() || !isSlotAvailable()) return;

    const times = getStartEndTimes();
    if (!times) return;

    // Check coin balance if using coins
    if (paymentMode === 'coins' && balance < COIN_COST) {
      return;
    }

    try {
      const result = await bookingMutation.mutateAsync({
        startTime: times.start,
        endTime: times.end,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        passengerCount: parseInt(passengerCount),
        weights: totalWeight.trim(),
        notes: notes.trim(),
        paymentMode,
      });

      if (result.ok) {
        // Deduct coins if payment mode is coins
        if (paymentMode === 'coins') {
          updateBalance(balance - COIN_COST);
          
          // Log redemption to localStorage
          const redemptionLog = {
            timestamp: Date.now(),
            amount: COIN_COST,
            description: 'Helicopter Reservation',
            date,
            time,
          };
          
          try {
            const existingLogs = localStorage.getItem('sb_helicopterRedemptions');
            const logs = existingLogs ? JSON.parse(existingLogs) : [];
            logs.push(redemptionLog);
            localStorage.setItem('sb_helicopterRedemptions', JSON.stringify(logs));
          } catch (error) {
            console.error('Error logging redemption:', error);
          }
        }

        // Show success screen
        setSuccessDetails({
          date,
          time,
          paymentMode,
        });
        setShowSuccess(true);
      } else if (result.reason === 'busy') {
        // Slot was taken between check and booking
        setHasCheckedAvailability(false);
        setAvailabilityCheckParams(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  // Success screen
  if (showSuccess && successDetails) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-accent">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reservation Confirmed!</CardTitle>
              <CardDescription>Your helicopter booking has been processed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="text-lg font-semibold">
                    {new Date(`${successDetails.date}T${successDetails.time}`).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{DEFAULT_DURATION_MINUTES} minutes</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="text-lg font-semibold">
                    {successDetails.paymentMode === 'coins' 
                      ? `${COIN_COST} Coins` 
                      : 'Payment Pending'}
                  </p>
                </div>
              </div>

              <Alert className="border-accent/50 bg-accent/10">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <AlertTitle>Pilot Calendar Updated</AlertTitle>
                <AlertDescription>
                  Your reservation has been added to the pilot's calendar. You will receive a confirmation email shortly.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleGoHome}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Main form
  return (
    <main className="min-h-screen px-6 pb-24 pt-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Helicopter Reservation</h1>
          </div>
          <p className="text-muted-foreground">
            Live availability powered by the pilot calendar
          </p>
        </div>

        {/* Calendar Configuration Error */}
        {availabilityData?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {availabilityData.error === 'Calendar not configured' 
                ? 'The calendar system is not configured yet. Please contact support.'
                : availabilityData.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Conflict Error */}
        {bookingMutation.data?.reason === 'busy' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Slot Unavailable</AlertTitle>
            <AlertDescription>
              That slot was just taken. Please choose another time.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Error */}
        {bookingMutation.data?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking Error</AlertTitle>
            <AlertDescription>
              {bookingMutation.data.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Availability Picker */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Check Availability</CardTitle>
            <CardDescription>Select your preferred date and time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setHasCheckedAvailability(false);
                    setAvailabilityCheckParams(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setHasCheckedAvailability(false);
                    setAvailabilityCheckParams(null);
                  }}
                  className="border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base py-1 px-3">
                  {DEFAULT_DURATION_MINUTES} minutes
                </Badge>
                <span className="text-sm text-muted-foreground">(Standard flight time)</span>
              </div>
            </div>

            <Button
              onClick={handleCheckAvailability}
              disabled={!date || !time || isCheckingAvailability}
              variant="outline"
              className="w-full border-2 border-accent text-accent hover:bg-accent/10"
            >
              {isCheckingAvailability ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>

            {/* Availability Status */}
            {hasCheckedAvailability && !isCheckingAvailability && availabilityData && !availabilityData.error && (
              <div className="mt-4">
                {isSlotAvailable() ? (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-600 dark:text-green-400">Available</AlertTitle>
                    <AlertDescription className="text-green-600/80 dark:text-green-400/80">
                      This time slot is available for booking.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Unavailable</AlertTitle>
                    <AlertDescription>
                      This time slot conflicts with an existing booking. Please choose a different time.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show busy blocks */}
                {availabilityData.busy.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Busy times today:</p>
                    <div className="flex flex-wrap gap-2">
                      {availabilityData.busy.map((block, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {new Date(block.start).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })} - {new Date(block.end).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservation Form */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
            <CardDescription>
              {isSlotAvailable() 
                ? 'Complete the form to reserve your flight' 
                : 'Check availability first to enable booking'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Legal Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={!isSlotAvailable()}
                className="border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={!isSlotAvailable()}
                className="border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isSlotAvailable()}
                className="border-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passengerCount">Passenger Count *</Label>
                <Input
                  id="passengerCount"
                  type="number"
                  min="1"
                  max="2"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  disabled={!isSlotAvailable()}
                  className="border-primary/30"
                />
                <p className="text-xs text-muted-foreground">Maximum 2 passengers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalWeight">Total Weight (lbs) *</Label>
                <Input
                  id="totalWeight"
                  type="number"
                  min="1"
                  value={totalWeight}
                  onChange={(e) => setTotalWeight(e.target.value)}
                  placeholder="350"
                  disabled={!isSlotAvailable()}
                  className="border-primary/30"
                />
                <p className="text-xs text-muted-foreground">Combined weight of all passengers</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information..."
                disabled={!isSlotAvailable()}
                className="border-primary/30 min-h-[100px]"
              />
            </div>

            {/* Booking Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={() => handleBooking('coins')}
                disabled={
                  !isSlotAvailable() || 
                  !isFormValid() || 
                  balance < COIN_COST || 
                  bookingMutation.isPending
                }
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Reserve with ${COIN_COST.toLocaleString()} Coins`
                )}
              </Button>
              {balance < COIN_COST && (
                <p className="text-sm text-destructive text-center">
                  Insufficient coins. You need {COIN_COST.toLocaleString()} coins (you have {balance.toLocaleString()})
                </p>
              )}

              <Button
                onClick={() => handleBooking('paid')}
                disabled={
                  !isSlotAvailable() || 
                  !isFormValid() || 
                  bookingMutation.isPending
                }
                variant="outline"
                className="w-full border-2 border-accent text-accent hover:bg-accent/10"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Reserve (Paid)'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Check real-time availability from the pilot's Google Calendar</p>
            <p>• Complete your reservation details and choose payment method</p>
            <p>• Your booking is instantly added to the pilot's calendar</p>
            <p>• Both you and the pilot receive confirmation emails</p>
            <p>• Paid bookings will be marked as "Payment Pending" until processed</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
