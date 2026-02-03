import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, Chip, ActivityIndicator, FAB, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { HomeStackParamList } from '../../types/navigation';
import { useRooms } from '../../hooks/api/useRooms';
import { useSocket } from '../../contexts/SocketContext';
import { Room, RoomFilters } from '../../types/models';
import { USF_GREEN } from '../../theme/colors';
import SearchFiltersModal from '../../components/common/SearchFiltersModal';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const socket = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RoomFilters>({});
  const [roomOccupancy, setRoomOccupancy] = useState<Record<string, string | undefined>>({});
  const [showFiltersModal, setShowFiltersModal] = useState(true); // Show modal on first load

  // Only fetch rooms if date/time filters are set
  const shouldFetchRooms = !!(filters.startTime && filters.endTime);
  const { data, isLoading, refetch, isRefetching } = useRooms(shouldFetchRooms ? filters : undefined);

  // Listen for real-time room updates
  useEffect(() => {
    const handleRoomUpdate = (update: any) => {
      console.log('Room update received:', update);

      // Update occupancy info if bookingEndTime is provided
      if (update.bookingEndTime) {
        setRoomOccupancy(prev => ({
          ...prev,
          [update.roomId]: update.bookingEndTime
        }));
      } else if (update.status === 'AVAILABLE') {
        // Clear occupancy info when room becomes available
        setRoomOccupancy(prev => {
          const newState = { ...prev };
          delete newState[update.roomId];
          return newState;
        });
      }

      // Refetch rooms list to show updated availability
      refetch();
    };

    socket.on('room:update', handleRoomUpdate);

    return () => {
      socket.off('room:update', handleRoomUpdate);
    };
  }, [socket, refetch]);

  const filteredRooms = data?.rooms.filter((room) =>
    room._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Format occupancy time to show "Occupied until [time]"
  const formatOccupiedUntil = (endTime: string): string => {
    const date = new Date(endTime);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const renderRoomCard = ({ item }: { item: Room }) => {
    const occupiedUntil = roomOccupancy[item._id];
    const now = new Date();

    // Get current and next booking info from room data
    const currentBooking = (item as any).currentBooking;
    const nextBooking = (item as any).nextBooking;

    // Determine if room is currently occupied based on booking times
    let isCurrentlyOccupied = false;
    let occupancyEndTime = occupiedUntil;

    // Check if there's an active booking right now (current time is between start and end)
    if (currentBooking) {
      const bookingStart = new Date(currentBooking.startTime);
      const bookingEnd = new Date(currentBooking.endTime);

      // Room is occupied if current time is between start and end
      if (now >= bookingStart && now < bookingEnd) {
        isCurrentlyOccupied = true;
        occupancyEndTime = currentBooking.endTime;
      }
    }

    // Fallback to room.available status from API
    if (!isCurrentlyOccupied && !item.available) {
      isCurrentlyOccupied = true;
    }

    return (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('RoomDetails', { roomId: item._id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.roomId}>
            {item._id}
          </Text>
          <Chip
            mode="flat"
            style={[
              styles.availabilityChip,
              { backgroundColor: isCurrentlyOccupied ? '#F44336' : '#4CAF50' }
            ]}
            textStyle={{ color: '#FFFFFF' }}
          >
            {isCurrentlyOccupied ? 'Occupied' : 'Available'}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.building}>
          {item.building} • Floor {item.floor}
        </Text>

        {isCurrentlyOccupied && occupancyEndTime && (
          <Text variant="bodySmall" style={styles.occupiedUntil}>
            🔴 Occupied until {formatOccupiedUntil(occupancyEndTime)}
          </Text>
        )}

        {!isCurrentlyOccupied && nextBooking && (
          <Text variant="bodySmall" style={styles.nextBooking}>
            📅 Next booking: {format(new Date(nextBooking.startTime), 'h:mm a')}
          </Text>
        )}

        <View style={styles.detailsRow}>
          <Chip mode="outlined" compact style={styles.detailChip}>
            {item.type}
          </Chip>
          <Chip mode="outlined" compact style={styles.detailChip}>
            {item.capacity}
          </Chip>
      
        </View>

        {item.features.length > 0 && (
          <View style={styles.featuresRow}>
            {item.features.slice(0, 3).map((feature, index) => (
              <Chip
                key={index}
                mode="outlined"
                compact
                style={styles.featureChip}
                textStyle={styles.featureText}
              >
                {feature}
              </Chip>
            ))}
            {item.features.length > 3 && (
              <Text style={styles.moreFeatures}>
                +{item.features.length - 3} more
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
    );
  };

  const handleApplyFilters = (newFilters: RoomFilters) => {
    setFilters(newFilters);
    setShowFiltersModal(false);
  };

  const formatFiltersSummary = () => {
    if (!filters.startTime || !filters.endTime) return '';
    const start = new Date(filters.startTime);
    const end = new Date(filters.endTime);
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <View style={styles.container}>
      {/* Date/Time Filter Summary */}
      {shouldFetchRooms && (
        <View style={styles.filterSummary}>
          <Text variant="bodyMedium" style={styles.filterText}>
            {formatFiltersSummary()}
          </Text>
          <Button
            mode="text"
            onPress={() => setShowFiltersModal(true)}
            compact
          >
            Change
          </Button>
        </View>
      )}

      <Searchbar
        placeholder="Search rooms..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {!shouldFetchRooms ? (
        <View style={styles.centered}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            When do you need a room?
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Select a date and time to see available rooms
          </Text>
          <Button
            mode="contained"
            onPress={() => setShowFiltersModal(true)}
            style={styles.selectButton}
            buttonColor={USF_GREEN}
            icon="calendar-clock"
          >
            Select Date & Time
          </Button>
        </View>
      ) : isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={USF_GREEN} />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderRoomCard}
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
                No rooms available for this time slot
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowFiltersModal(true)}
                style={styles.changeDateButton}
              >
                Try Different Time
              </Button>
            </View>
          }
        />
      )}

      {shouldFetchRooms && (
        <FAB
          icon="filter-variant"
          style={styles.fab}
          onPress={() => setShowFiltersModal(true)}
        />
      )}

      <SearchFiltersModal
        visible={showFiltersModal}
        onDismiss={() => {
          // Only allow dismissing if filters are already set
          if (shouldFetchRooms) {
            setShowFiltersModal(false);
          }
        }}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F0F9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterText: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  searchbar: {
    margin: 16,
    elevation: 2,
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
    marginBottom: 8,
  },
  roomId: {
    fontWeight: 'bold',
    color: USF_GREEN,
  },
  availabilityChip: {
    height: 28,
  },
  building: {
    color: '#666',
    marginBottom: 8,
  },
  occupiedUntil: {
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 8,
  },
  nextBooking: {
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  detailChip: {
    height: 32,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  featureChip: {
    height: 28,
  },
  featureText: {
    fontSize: 11,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectButton: {
    marginTop: 8,
  },
  changeDateButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: USF_GREEN,
  },
});
