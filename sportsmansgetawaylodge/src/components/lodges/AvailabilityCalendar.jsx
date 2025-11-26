
import React, { useState, useEffect } from 'react';
import { Lodge } from '@/api/entities';
import { Calendar } from '@/components/ui/calendar';
import { useEditMode } from '../admin/EditModeContext';
import { addDays, eachDayOfInterval, format } from 'date-fns';
import { Loader2, Search, CheckCircle2, XCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AvailabilityCalendar({ lodgeId }) {
    const { isEditMode } = useEditMode();
    const [lodge, setLodge] = useState(null);
    const [blockedDates, setBlockedDates] = useState([]);
    const [bookedDates, setBookedDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [month, setMonth] = useState(new Date());
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [alternativeLodges, setAlternativeLodges] = useState([]);
    const [isCheckingAlternatives, setIsCheckingAlternatives] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchData = React.useCallback(async () => {
        if (!lodgeId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const lodgeData = await Lodge.get(lodgeId);
            setLodge(lodgeData);
            setBlockedDates(lodgeData.blocked_dates?.map(d => new Date(d + 'T00:00:00')) || []);
            setBookedDates(lodgeData.booked_dates?.map(d => new Date(d + 'T00:00:00')) || []);
        } catch (error) {
            console.error("Failed to fetch availability data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [lodgeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDayClick = async (day, modifiers) => {
        if (modifiers.past || isUpdating || !isEditMode) return;

        setIsUpdating(true);
        const clickedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dateString = clickedDate.toISOString().split('T')[0];
        
        const isBlocked = blockedDates.some(d => d.getTime() === clickedDate.getTime());
        const isBooked = bookedDates.some(d => d.getTime() === clickedDate.getTime());

        let newBlockedDates = lodge.blocked_dates || [];
        let newBookedDates = lodge.booked_dates || [];

        if (isBooked) {
            newBookedDates = newBookedDates.filter(d => d !== dateString);
            newBlockedDates = [...newBlockedDates, dateString];
        } else if (isBlocked) {
            newBlockedDates = newBlockedDates.filter(d => d !== dateString);
        } else {
            newBookedDates = [...newBookedDates, dateString];
        }

        try {
            const updatedLodge = await Lodge.update(lodgeId, { 
                blocked_dates: newBlockedDates,
                booked_dates: newBookedDates
            });
            setLodge(updatedLodge);
            setBlockedDates(updatedLodge.blocked_dates?.map(d => new Date(d + 'T00:00:00')) || []);
            setBookedDates(updatedLodge.booked_dates?.map(d => new Date(d + 'T00:00:00')) || []);
        } catch (error) {
            console.error("Failed to update dates:", error);
            alert("Failed to update availability. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRangeSelect = (range) => {
        setDateRange(range || { from: undefined, to: undefined });
        if (range?.from) {
            setCheckInDate(format(range.from, 'yyyy-MM-dd'));
        } else {
            setCheckInDate('');
        }
        if (range?.to) {
            setCheckOutDate(format(range.to, 'yyyy-MM-dd'));
        } else {
            setCheckOutDate('');
        }
        setSearchResult(null);
        setAlternativeLodges([]);
    };

    const handleCheckInChange = (e) => {
        const value = e.target.value;
        setCheckInDate(value);
        if (value) {
            const date = new Date(value + 'T00:00:00');
            setDateRange(prev => ({ ...prev, from: date }));
        } else {
            setDateRange(prev => ({ ...prev, from: undefined }));
        }
        setSearchResult(null);
        setAlternativeLodges([]);
    };

    const handleCheckOutChange = (e) => {
        const value = e.target.value;
        setCheckOutDate(value);
        if (value) {
            const date = new Date(value + 'T00:00:00');
            setDateRange(prev => ({ ...prev, to: date }));
        } else {
            setDateRange(prev => ({ ...prev, to: undefined }));
        }
        setSearchResult(null);
        setAlternativeLodges([]);
    };

    const checkAvailability = async () => {
        if (!dateRange.from || !dateRange.to) {
            setSearchResult({ available: false, message: 'Please select both check-in and check-out dates' });
            return;
        }

        if (dateRange.from >= dateRange.to) {
            setSearchResult({ available: false, message: 'Check-out date must be after check-in date' });
            return;
        }

        const datesInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        
        const unavailableDates = datesInRange.filter(date => {
            const dateTime = date.getTime();
            return blockedDates.some(d => d.getTime() === dateTime) || 
                   bookedDates.some(d => d.getTime() === dateTime);
        });

        if (unavailableDates.length === 0) {
            const nights = datesInRange.length - 1;
            setSearchResult({ 
                available: true, 
                message: `This lodge is available for your selected dates (${nights} ${nights === 1 ? 'night' : 'nights'})!`,
                nights: nights
            });
            setAlternativeLodges([]);
        } else {
            setSearchResult({ 
                available: false, 
                message: `Unfortunately, ${unavailableDates.length} ${unavailableDates.length === 1 ? 'date' : 'dates'} in your range ${unavailableDates.length === 1 ? 'is' : 'are'} unavailable.`
            });
            
            await findAlternativeLodges(datesInRange);
        }
    };

    const findAlternativeLodges = async (datesInRange) => {
        setIsCheckingAlternatives(true);
        try {
            // Fetch all lodges
            const allLodges = await Lodge.list();
            
            // Filter lodges to exclude current one and check availability
            const availableLodges = allLodges.filter(otherLodge => {
                // Skip the current lodge
                if (otherLodge.id === lodgeId) return false;
                
                // Skip lodges without proper data (e.g., name or location might be missing if it's not a complete record)
                if (!otherLodge.name || !otherLodge.location) return false;
                
                // Get all blocked and booked dates for this lodge
                const otherBlockedDates = (otherLodge.blocked_dates || []).map(d => {
                    const date = new Date(d + 'T00:00:00');
                    return date.getTime();
                });
                
                const otherBookedDates = (otherLodge.booked_dates || []).map(d => {
                    const date = new Date(d + 'T00:00:00');
                    return date.getTime();
                });
                
                // Combine both blocked and booked dates into one array of unavailable timestamps
                const allUnavailableDates = [...otherBlockedDates, ...otherBookedDates];
                
                // Check if ANY date in the user's selected range is unavailable in the alternative lodge
                const hasConflict = datesInRange.some(date => {
                    const dateTime = date.getTime();
                    return allUnavailableDates.includes(dateTime);
                });
                
                // Only return true if there are NO conflicts (meaning the lodge is available for the full range)
                return !hasConflict;
            });
            
            setAlternativeLodges(availableLodges);
        } catch (error) {
            console.error("Failed to fetch alternative lodges:", error);
            setAlternativeLodges([]); // Clear alternatives on error
        } finally {
            setIsCheckingAlternatives(false);
        }
    };

    const modifiers = {
        past: date => addDays(new Date(), -1) > date,
        booked: bookedDates,
        blocked: blockedDates,
        selected: dateRange?.from && dateRange?.to ? (date) => {
            const dateTime = date.getTime();
            return dateTime >= dateRange.from.getTime() && dateTime <= dateRange.to.getTime();
        } : undefined
    };

    const modifierStyles = {
        past: { opacity: 0.5, cursor: 'not-allowed' },
        booked: { backgroundColor: '#fca5a5', color: '#7f1d1d', cursor: isEditMode ? 'pointer' : 'not-allowed' },
        blocked: { backgroundColor: '#a3a3a3', color: '#171717', cursor: isEditMode ? 'pointer' : 'not-allowed' },
        disabled: { cursor: 'not-allowed' },
        selected: { backgroundColor: '#bfdbfe', color: '#1e3a8a', fontWeight: 'bold' }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            </div>
        );
    }

    if (!lodgeId) {
        return <div className="text-center text-stone-600 p-8">Save the lodge first to manage its availability.</div>;
    }

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="w-full max-w-full overflow-y-auto">
            {/* Lodge Name Header */}
            {lodge && (
                <div className="mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-stone-800 text-center">
                        {lodge.name}
                    </h2>
                    <p className="text-sm md:text-base text-stone-600 text-center mt-1">
                        Availability Calendar
                    </p>
                </div>
            )}

            {isEditMode && (
                <div className="p-3 mb-4 text-center bg-green-100 border border-green-200 rounded-lg text-xs md:text-sm text-green-800">
                    <p><b>Admin Edit Mode:</b> Click dates to cycle through: Available → Booked (red) → Blocked (gray) → Available</p>
                    <p className="mt-1">The date range search below shows what users will see.</p>
                </div>
            )}

            {/* Date Range Search - Always Visible */}
            <Card className="mb-4 md:mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Search className="w-4 h-4 md:w-5 md:h-5 text-green-700" />
                        Check Date Range Availability
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs md:text-sm text-stone-600 mb-4">
                        Enter your check-in and check-out dates to see if this lodge is available for your stay.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-stone-700 mb-2">
                                Check-in Date
                            </label>
                            <Input
                                type="date"
                                value={checkInDate}
                                onChange={handleCheckInChange}
                                min={today}
                                className="w-full text-sm md:text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-stone-700 mb-2">
                                Check-out Date
                            </label>
                            <Input
                                type="date"
                                value={checkOutDate}
                                onChange={handleCheckOutChange}
                                min={checkInDate || today}
                                className="w-full text-sm md:text-base"
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={checkAvailability}
                        disabled={!dateRange?.from || !dateRange?.to || isCheckingAlternatives}
                        className="w-full bg-green-700 hover:bg-green-800 text-sm md:text-base"
                    >
                        {isCheckingAlternatives ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Check Availability
                            </>
                        )}
                    </Button>
                    
                    {searchResult && (
                        <div className={`mt-4 p-3 md:p-4 rounded-lg flex items-start gap-2 md:gap-3 ${
                            searchResult.available 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            {searchResult.available ? (
                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm md:text-base ${searchResult.available ? 'text-green-800' : 'text-red-800'}`}>
                                    {searchResult.available ? 'Available!' : 'Not Available'}
                                </p>
                                <p className={`text-xs md:text-sm ${searchResult.available ? 'text-green-700' : 'text-red-700'}`}>
                                    {searchResult.message}
                                </p>
                            </div>
                        </div>
                    )}

                    {!searchResult?.available && alternativeLodges.length > 0 && (
                        <div className="mt-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2 md:gap-3 mb-3">
                                <Home className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-blue-800 mb-1 text-sm md:text-base">
                                        Alternative Lodges Available
                                    </p>
                                    <p className="text-xs md:text-sm text-blue-700">
                                        We found {alternativeLodges.length} {alternativeLodges.length === 1 ? 'lodge' : 'lodges'} available for your dates:
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 ml-0 md:ml-8">
                                {alternativeLodges.map((altLodge) => (
                                    <Link 
                                        key={altLodge.id} 
                                        to={`${createPageUrl('Lodges')}?lodge=${altLodge.id}`}
                                        className="block p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-stone-800 hover:text-green-700 text-sm md:text-base truncate">
                                                    {altLodge.name}
                                                </p>
                                                <p className="text-xs md:text-sm text-stone-600 truncate">
                                                    {altLodge.location}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-green-700 text-sm md:text-base">
                                                    ${altLodge.price_per_person_per_night}
                                                </p>
                                                <p className="text-xs text-stone-500 whitespace-nowrap">per person/night</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {!searchResult?.available && alternativeLodges.length === 0 && searchResult && !isCheckingAlternatives && (
                        <div className="mt-4 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs md:text-sm text-amber-800">
                                Unfortunately, no other lodges are available for your selected dates. Please try different dates.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <div className="relative flex justify-center overflow-x-auto pb-4">
                {(isUpdating || isLoading) && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-green-700" />
                    </div>
                )}
                <div className="min-w-fit">
                    <Calendar
                        mode={isEditMode ? "single" : "range"}
                        onDayClick={isEditMode ? handleDayClick : undefined}
                        selected={!isEditMode ? dateRange : undefined}
                        onSelect={!isEditMode ? handleRangeSelect : undefined}
                        modifiers={modifiers}
                        modifiersStyles={modifierStyles}
                        className="p-0"
                        month={month}
                        onMonthChange={setMonth}
                        numberOfMonths={isMobile ? 1 : 2}
                        pagedNavigation
                    />
                </div>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 mt-4 pt-4 border-t text-xs md:text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-white border"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-[#a3a3a3]"></div>
                    <span>Blocked by Admin</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-[#fca5a5]"></div>
                    <span>Manually Booked</span>
                </div>
                {!isEditMode && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-[#bfdbfe]"></div>
                        <span>Your Selection</span>
                    </div>
                )}
            </div>
        </div>
    );
}
