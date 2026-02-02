import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookingsStackParamList } from '../../types/navigation';
import { useBooking, useConfirmBooking, useCancelBooking } from '../../hooks/api/useBookings';
import { useRoom } from '../../hooks/api/useRooms';
import { USF_GREEN, STATUS_PENDING, STATUS_CONFIRMED, STATUS_CANCELLED, STATUS_EXPIRED } from '../../theme/colors';
import { format } from 'date-fns';

type BookingDetailsRouteProp = RouteProp<BookingsStackParamList, 'BookingDetails'>;
type BookingDetailsNavigationProp = StackNavigationProp<BookingsStackParamList, 'BookingDetails'>;

export default function BookingDetailsScreen() {
  const route = useRoute<BookingDetailsRouteProp>();
  const navigation = useNavigation<BookingDetailsNavigationProp>();
  const { bookingId } = route.params;

  const { data: bookingData, isLoading: bookingLoading } = useBooking(bookingId);
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const booking = bookingData?.booking;

  // Handle both populated and non-populated roomId
  const roomId = booking?.roomId
    ? typeof booking.roomId === 'string'
      ? booking.roomId
      : (booking.roomId as any)?._id || ''
    : '';

  const { data: roomData } = useRoom(roomId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return STATUS_PENDING;
      case 'CONFIRMED':
        return STATUS_CONFIRMED;
      case 'CANCELLED':
        return STATUS_CANCELLED;
      case 'EXPIRED':
        return STATUS_EXPIRED;
      default:
        return '#999';
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmBooking.mutateAsync(bookingId);
      Alert.alert(
        '✅ Booking Confirmed!',
        'Your room has been successfully reserved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyBookings'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm booking');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync(bookingId);
              Alert.alert('Cancelled', 'Booking cancelled successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  if (bookingLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={USF_GREEN} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">Booking not found</Text>
      </View>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));

  const canConfirm = booking.status === 'PENDING';
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.bookingId}>
              Booking #{booking._id.slice(-6).toUpperCase()}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(booking.status) }
              ]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {booking.status}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Room</Text>
            <Text variant="bodyLarge" style={styles.roomId}>{roomId}</Text>
            {roomData?.room && (
              <>
                <Text variant="bodyMedium" style={styles.detail}>
                  {roomData.room.building} • Floor {roomData.room.floor}
                </Text>
                <Text variant="bodyMedium" style={styles.detail}>
                  {roomData.room.type} • {roomData.room.capacity}
                </Text>
              </>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Time</Text>
            <Text variant="bodyLarge">{format(startDate, 'EEEE, MMM d, yyyy')}</Text>
            <Text variant="bodyMedium" style={styles.detail}>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </Text>
            <Text variant="bodySmall" style={styles.duration}>
              Duration: {duration} minutes
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
            <Text variant="bodyMedium" style={styles.detail}>
              Created: {format(new Date(booking.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
            {booking.confirmedAt && (
              <Text variant="bodyMedium" style={styles.detail}>
                Confirmed: {format(new Date(booking.confirmedAt), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
            {booking.cancelledAt && (
              <Text variant="bodyMedium" style={styles.detail}>
                Cancelled: {format(new Date(booking.cancelledAt), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
          </View>

          {booking.status === 'PENDING' && (
            <View style={styles.warningBox}>
              <Text variant="bodyMedium" style={styles.warningText}>
                ⏱️ This booking will expire in 10 minutes unless confirmed
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {canConfirm && (
        <Button
          mode="contained"
          onPress={handleConfirm}
          loading={confirmBooking.isPending}
          disabled={confirmBooking.isPending}
          style={styles.confirmButton}
          contentStyle={styles.buttonContent}
        >
          Confirm Booking
        </Button>
      )}

      {canCancel && (
        <Button
          mode="outlined"
          onPress={handleCancel}
          loading={cancelBooking.isPending}
          disabled={cancelBooking.isPending}
          style={styles.cancelButton}
          textColor="#F44336"
        >
          Cancel Booking
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to ensure button isn't covered by bottom nav
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
  bookingId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  statusChip: {
    height: 32,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  roomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
    marginBottom: 4,
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
    marginTop: 16,
  },
  warningText: {
    color: '#E65100',
  },
  confirmButton: {
    margin: 16,
    marginTop: 0,
  },
  buttonContent: {
    height: 50,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: '#F44336',
  },
});
