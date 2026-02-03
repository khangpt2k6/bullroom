import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookingsStackParamList } from '../../types/navigation';
import { useBookings } from '../../hooks/api/useBookings';
import { useAuth } from '../../contexts/AuthContext';
import { Booking } from '../../types/models';
import { USF_GREEN, STATUS_PENDING, STATUS_CONFIRMED, STATUS_CANCELLED, STATUS_EXPIRED } from '../../theme/colors';
import { format } from 'date-fns';

type MyBookingsScreenNavigationProp = StackNavigationProp<BookingsStackParamList, 'MyBookings'>;

export default function MyBookingsScreen() {
  const navigation = useNavigation<MyBookingsScreenNavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Fetch all bookings (not filtered by status)
  const { data, isLoading, refetch, isRefetching } = useBookings(user?._id || '');

  // Filter bookings based on whether they're actually past or not
  const now = new Date();
  const filteredBookings = (data?.bookings || []).filter((booking) => {
    const endTime = new Date(booking.endTime);
    const isPast = endTime < now;

    if (activeTab === 'active') {
      // Active tab: bookings that haven't ended yet and are PENDING or CONFIRMED
      return !isPast && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');
    } else {
      // Past tab: bookings that have ended OR are CANCELLED/EXPIRED
      return isPast || booking.status === 'CANCELLED' || booking.status === 'EXPIRED';
    }
  });

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

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const startDate = new Date(item.startTime);
    const endDate = new Date(item.endTime);

    // Handle both populated and non-populated roomId
    const roomId = typeof item.roomId === 'string'
      ? item.roomId
      : (item.roomId as any)?._id || 'Unknown Room';

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: item._id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge" style={styles.roomId}>
              {roomId}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) }
              ]}
              textStyle={{ color: '#FFFFFF' }}
            >
              {item.status}
            </Chip>
          </View>

          <View style={styles.dateTimeSection}>
            <Text variant="bodyLarge" style={styles.date}>
              {format(startDate, 'EEEE, MMM d, yyyy')}
            </Text>
            <Text variant="bodyMedium" style={styles.time}>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </Text>
          </View>

          {item.status === 'PENDING' && (
            <View style={styles.warningBox}>
              <Text variant="bodySmall" style={styles.warningText}>
                ⏱️ Confirm within 10 minutes or booking will expire
              </Text>
            </View>
          )}

          <Text variant="bodySmall" style={styles.createdAt}>
            Booked on {format(new Date(item.createdAt), 'MMM d, h:mm a')}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'active' | 'past')}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'past', label: 'Past' },
        ]}
        style={styles.segmentedButtons}
      />

      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={USF_GREEN} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[USF_GREEN]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {activeTab === 'active'
                  ? 'No active bookings'
                  : 'No past bookings'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  segmentedButtons: {
    margin: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  statusChip: {
    height: 28,
  },
  dateTimeSection: {
    marginBottom: 12,
  },
  date: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  time: {
    color: '#666',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    color: '#E65100',
  },
  createdAt: {
    color: '#999',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#999',
  },
});
