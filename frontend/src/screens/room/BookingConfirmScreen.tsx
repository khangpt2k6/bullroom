import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation';
import { useRoom } from '../../hooks/api/useRooms';
import { useCreateBooking } from '../../hooks/api/useBookings';
import { useAuth } from '../../contexts/AuthContext';
import { USF_GREEN } from '../../theme/colors';
import { format } from 'date-fns';

type BookingConfirmRouteProp = RouteProp<HomeStackParamList, 'BookingConfirm'>;
type BookingConfirmNavigationProp = StackNavigationProp<HomeStackParamList, 'BookingConfirm'>;

export default function BookingConfirmScreen() {
  const route = useRoute<BookingConfirmRouteProp>();
  const navigation = useNavigation<BookingConfirmNavigationProp>();
  const { user } = useAuth();
  const { roomId, startTime, endTime } = route.params;

  const { data: roomData, isLoading: roomLoading } = useRoom(roomId);
  const createBooking = useCreateBooking();

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a room');
      return;
    }

    try {
      // userId is automatically taken from auth token by backend
      await createBooking.mutateAsync({
        roomId,
        startTime,
        endTime,
      });

      // Success! Show confirmation and navigate to bookings
      Alert.alert(
        '✅ Booking Created!',
        'Your booking has been created successfully! Please confirm it within 10 minutes to secure your room.',
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              // Navigate to Bookings tab
              navigation.getParent()?.navigate('BookingsTab');
            },
          },
          {
            text: 'Browse More Rooms',
            style: 'cancel',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error: any) {
      // Check if it's a conflict error (room already occupied)
      const isConflict = error.status === 409 ||
                        error.response?.status === 409 ||
                        error.message?.includes('conflicts with an existing booking');

      if (isConflict) {
        const bookingTime = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
        Alert.alert(
          '🚫 Time Slot Occupied',
          `This room is already booked for ${bookingTime}. Someone else has reserved this time slot.\n\nPlease choose a different time or browse other available rooms.`,
          [
            {
              text: 'Choose Different Time',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Browse Other Rooms',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Booking Failed',
          error.message || 'Failed to create booking. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (roomLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={USF_GREEN} />
      </View>
    );
  }

  const room = roomData?.room;

  if (!room) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">Room not found</Text>
      </View>
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000)); // minutes

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Confirm Your Booking
          </Text>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Room</Text>
            <Text variant="bodyLarge" style={styles.roomId}>{room._id}</Text>
            <Text variant="bodyMedium" style={styles.detail}>
              {room.building} • Floor {room.floor}
            </Text>
            <Text variant="bodyMedium" style={styles.detail}>
              {room.type} • {room.capacity}
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Time</Text>
            <Text variant="bodyLarge">{format(start, 'EEEE, MMM d, yyyy')}</Text>
            <Text variant="bodyMedium" style={styles.detail}>
              {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
            </Text>
            <Text variant="bodySmall" style={styles.duration}>
              Duration: {duration} minutes
            </Text>
          </View>

          <View style={styles.warningBox}>
            <Text variant="bodyMedium" style={styles.warningText}>
              ⏱️ Important: You must confirm this booking within 10 minutes, or it will be automatically cancelled.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleConfirm}
        loading={createBooking.isPending}
        disabled={createBooking.isPending}
        style={styles.confirmButton}
        contentStyle={styles.confirmButtonContent}
      >
        Confirm Booking
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={createBooking.isPending}
        style={styles.cancelButton}
      >
        Cancel
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
  title: {
    fontWeight: 'bold',
    color: USF_GREEN,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  roomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  detail: {
    color: '#666',
    marginTop: 4,
  },
  duration: {
    color: '#999',
    marginTop: 8,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    color: '#E65100',
  },
  confirmButton: {
    margin: 16,
    marginTop: 0,
  },
  confirmButtonContent: {
    height: 50,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});
