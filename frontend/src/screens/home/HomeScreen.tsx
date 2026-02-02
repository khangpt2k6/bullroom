import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation';
import { useRooms } from '../../hooks/api/useRooms';
import { useSocket } from '../../contexts/SocketContext';
import { Room, RoomFilters } from '../../types/models';
import { USF_GREEN } from '../../theme/colors';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const socket = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RoomFilters>({});

  const { data, isLoading, refetch, isRefetching } = useRooms(filters);

  // Listen for real-time room updates
  useEffect(() => {
    const handleRoomUpdate = (update: any) => {
      console.log('Room update received:', update);
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

  const renderRoomCard = ({ item }: { item: Room }) => (
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
              { backgroundColor: item.available ? '#4CAF50' : '#F44336' }
            ]}
            textStyle={{ color: '#FFFFFF' }}
          >
            {item.available ? 'Available' : 'Occupied'}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.building}>
          {item.building} • Floor {item.floor}
        </Text>

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

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search rooms..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading && !isRefetching ? (
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
                No rooms found
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="filter"
        style={styles.fab}
        onPress={() => {
          // TODO: Open filter bottom sheet
          console.log('Open filters');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    marginBottom: 12,
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
  },
  emptyText: {
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: USF_GREEN,
  },
});
