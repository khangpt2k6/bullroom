import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation';
import { useRoom } from '../../hooks/api/useRooms';
import { useBookings } from '../../hooks/api/useBookings';
import { useSocket } from '../../contexts/SocketContext';
import { USF_GREEN } from '../../theme/colors';
import { format } from 'date-fns';

type RoomDetailsRouteProp = RouteProp<HomeStackParamList, 'RoomDetails'>;
type RoomDetailsNavigationProp = StackNavigationProp<HomeStackParamList, 'RoomDetails'>;

export default function RoomDetailsScreen() {
  const route = useRoute<RoomDetailsRouteProp>();
  const navigation = useNavigation<RoomDetailsNavigationProp>();
  const socket = useSocket();
  const { roomId } = route.params;

  const { data, isLoading, refetch } = useRoom(roomId);
  const { data: bookingsData } = useBookings({ status: ['CONFIRMED', 'PENDING'] });

  // Date/Time state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    // Subscribe to real-time updates for this room
    socket.subscribeToRoom(roomId);

    // Listen for room status updates
    const handleRoomStatus = (update: any) => {
      console.log('Room status update:', update);
      // Refetch room data to get latest availability
      refetch();
    };

    socket.on('room:status', handleRoomStatus);
    socket.on('room:update', handleRoomStatus);

    return () => {
      socket.off('room:status', handleRoomStatus);
      socket.off('room:update', handleRoomStatus);
      socket.unsubscribeFromRoom(roomId);
    };
  }, [roomId, socket, refetch]);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      // Automatically adjust end date if it's before start date
      if (selectedDate >= endDate) {
        setEndDate(new Date(selectedDate.getTime() + 60 * 60 * 1000)); // Add 1 hour
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      if (selectedDate <= startDate) {
        Alert.alert('Invalid Time', 'End time must be after start time');
        return;
      }
      setEndDate(selectedDate);
    }
  };

  const handleBookRoom = () => {
    // Validate times
    const now = new Date();
    if (startDate < now) {
      Alert.alert('Invalid Time', 'Start time cannot be in the past');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    // Check maximum 3 hours limit
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    if (durationHours > 3) {
      Alert.alert('Booking Too Long', 'Maximum booking duration is 3 hours');
      return;
    }

    // Navigate to booking confirmation with selected times
    navigation.navigate('BookingConfirm', {
      roomId: room._id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  };

  // Helper function to format duration
  const formatDuration = (startDate: Date, endDate: Date) => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes} mins`;
    } else if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} mins`;
    }
  };

  // Check if selected time conflicts with any existing booking
  const checkTimeConflict = () => {
    if (!bookingsData?.bookings) return null;

    const selectedStart = startDate.getTime();
    const selectedEnd = endDate.getTime();

    const conflictingBooking = bookingsData.bookings.find((booking) => {
      const bookingStart = new Date(booking.startTime).getTime();
      const bookingEnd = new Date(booking.endTime).getTime();

      // Check if time ranges overlap
      return (
        (selectedStart >= bookingStart && selectedStart < bookingEnd) ||
        (selectedEnd > bookingStart && selectedEnd <= bookingEnd) ||
        (selectedStart <= bookingStart && selectedEnd >= bookingEnd)
      );
    });

    return conflictingBooking;
  };

  const conflictingBooking = checkTimeConflict();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={USF_GREEN} />
      </View>
    );
  }

  if (!data?.room) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">Room not found</Text>
      </View>
    );
  }

  const room = data.room;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.roomId}>
              {room._id}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.availabilityChip,
                { backgroundColor: room.available ? '#4CAF50' : '#F44336' }
              ]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {room.available ? 'Available' : 'Occupied'}
            </Chip>
          </View>

          <Text variant="titleMedium" style={styles.building}>
            {room.building} • Floor {room.floor}
          </Text>

          <Divider style={styles.divider} />

          <Text variant="titleSmall" style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsRow}>
            <Text variant="bodyMedium" style={styles.label}>Type:</Text>
            <Text variant="bodyMedium">{room.type}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text variant="bodyMedium" style={styles.label}>Capacity:</Text>
            <Text variant="bodyMedium">{room.capacity}</Text>
          </View>

          {room.description && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>Description</Text>
              <Text variant="bodyMedium">{room.description}</Text>
            </>
          )}

          {room.features.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresContainer}>
                {room.features.map((feature, index) => (
                  <Chip key={index} mode="outlined" style={styles.featureChip}>
                    {feature}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Booking Time Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>📅 Select Booking Time</Text>
          
          {/* Start Time */}
          <View style={styles.timeSection}>
            <Text variant="bodyMedium" style={styles.timeLabel}>Start Time:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={format(startDate, "yyyy-MM-dd'T'HH:mm")}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setStartDate(newDate);
                    if (newDate >= endDate) {
                      setEndDate(new Date(newDate.getTime() + 60 * 60 * 1000));
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  fontFamily: 'system-ui',
                }}
              />
            ) : (
              <View style={styles.timeButtonsRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setPickerMode('date');
                    setShowStartPicker(true);
                  }}
                  style={styles.timeButton}
                >
                  📅 {format(startDate, 'MMM dd, yyyy')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setPickerMode('time');
                    setShowStartPicker(true);
                  }}
                  style={styles.timeButton}
                >
                  🕐 {format(startDate, 'hh:mm a')}
                </Button>
              </View>
            )}
          </View>

          {/* End Time */}
          <View style={styles.timeSection}>
            <Text variant="bodyMedium" style={styles.timeLabel}>End Time:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={format(endDate, "yyyy-MM-dd'T'HH:mm")}
                min={format(new Date(startDate.getTime() + 60000), "yyyy-MM-dd'T'HH:mm")}
                max={format(new Date(startDate.getTime() + 3 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    if (newDate <= startDate) {
                      Alert.alert('Invalid Time', 'End time must be after start time');
                      return;
                    }
                    const duration = (newDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
                    if (duration > 3) {
                      Alert.alert('Duration Too Long', 'Maximum booking duration is 3 hours');
                      return;
                    }
                    setEndDate(newDate);
                  }
                }}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  fontFamily: 'system-ui',
                }}
              />
            ) : (
              <View style={styles.timeButtonsRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setPickerMode('date');
                    setShowEndPicker(true);
                  }}
                  style={styles.timeButton}
                >
                  📅 {format(endDate, 'MMM dd, yyyy')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setPickerMode('time');
                    setShowEndPicker(true);
                  }}
                  style={styles.timeButton}
                >
                  🕐 {format(endDate, 'hh:mm a')}
                </Button>
              </View>
            )}
          </View>

          {/* Duration Display */}
          <View style={[
            styles.durationContainer,
            (endDate.getTime() - startDate.getTime()) > (3 * 60 * 60 * 1000) && styles.durationError
          ]}>
            <Text variant="bodySmall" style={styles.durationText}>
              Duration: {formatDuration(startDate, endDate)}
              {(endDate.getTime() - startDate.getTime()) > (3 * 60 * 60 * 1000) && 
                ' ⚠️ (Max 3 hours allowed)'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Date/Time Pickers - Only for iOS/Android */}
      {Platform.OS !== 'web' && showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode={pickerMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS !== 'web' && showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode={pickerMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      {/* Time Conflict Warning */}
      {conflictingBooking && (
        <Card style={[styles.card, styles.conflictWarning]}>
          <Card.Content>
            <View style={styles.conflictHeader}>
              <Text variant="titleMedium" style={styles.conflictTitle}>
                ⚠️ Time Conflict
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.conflictText}>
              You already have a booking for room <Text style={styles.conflictRoomId}>{conflictingBooking.roomId}</Text> during this time:
            </Text>
            <View style={styles.conflictTimeContainer}>
              <Text variant="bodySmall" style={styles.conflictTime}>
                📅 {format(new Date(conflictingBooking.startTime), 'MMM dd, yyyy')}
              </Text>
              <Text variant="bodySmall" style={styles.conflictTime}>
                🕐 {format(new Date(conflictingBooking.startTime), 'hh:mm a')} - {format(new Date(conflictingBooking.endTime), 'hh:mm a')}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.conflictNote}>
              Please choose a different time or cancel your existing booking first.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        onPress={handleBookRoom}
        disabled={!room.available || !!conflictingBooking}
        style={styles.bookButton}
        contentStyle={styles.bookButtonContent}
      >
        {conflictingBooking
          ? 'Time Conflict - Cannot Book'
          : room.available
            ? 'Book This Room'
            : 'Room Not Available'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  availabilityChip: {
    height: 32,
  },
  building: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: USF_GREEN,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
    width: 80,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    marginBottom: 8,
  },
  timeSection: {
    marginBottom: 16,
  },
  timeLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  timeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
  },
  durationContainer: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  durationError: {
    backgroundColor: '#FFE0E0',
  },
  durationText: {
    textAlign: 'center',
    fontWeight: '600',
    color: USF_GREEN,
  },
  bookButton: {
    margin: 16,
    marginTop: 8,
  },
  bookButtonContent: {
    height: 50,
  },
  conflictWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 2,
    marginTop: 8,
  },
  conflictHeader: {
    marginBottom: 8,
  },
  conflictTitle: {
    color: '#E65100',
    fontWeight: 'bold',
  },
  conflictText: {
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  conflictRoomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  conflictTimeContainer: {
    backgroundColor: '#FFE0B2',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  conflictTime: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  conflictNote: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
