import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation';
import { useRoom } from '../../hooks/api/useRooms';
import { useSocket } from '../../contexts/SocketContext';
import { USF_GREEN } from '../../theme/colors';

type RoomDetailsRouteProp = RouteProp<HomeStackParamList, 'RoomDetails'>;
type RoomDetailsNavigationProp = StackNavigationProp<HomeStackParamList, 'RoomDetails'>;

export default function RoomDetailsScreen() {
  const route = useRoute<RoomDetailsRouteProp>();
  const navigation = useNavigation<RoomDetailsNavigationProp>();
  const socket = useSocket();
  const { roomId } = route.params;

  const { data, isLoading, refetch } = useRoom(roomId);

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

  const handleBookRoom = () => {
    // Navigate to booking confirmation with default time (current time + 1 hour)
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    navigation.navigate('BookingConfirm', {
      roomId: room._id,
      startTime,
      endTime,
    });
  };

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

      <Button
        mode="contained"
        onPress={handleBookRoom}
        disabled={!room.available}
        style={styles.bookButton}
        contentStyle={styles.bookButtonContent}
      >
        {room.available ? 'Book This Room' : 'Room Not Available'}
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
  bookButton: {
    margin: 16,
    marginTop: 8,
  },
  bookButtonContent: {
    height: 50,
  },
});
