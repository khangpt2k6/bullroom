import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  Home: undefined;
  RoomDetails: { roomId: string };
  BookingConfirm: { roomId: string; startTime: string; endTime: string };
};

// Bookings Stack Navigator
export type BookingsStackParamList = {
  MyBookings: undefined;
  BookingDetails: { bookingId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  Profile: undefined;
};

// Root Stack Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Screen Props Types
export type HomeScreenProps = CompositeScreenProps<
  StackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type RoomDetailsScreenProps = CompositeScreenProps<
  StackScreenProps<HomeStackParamList, 'RoomDetails'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type BookingConfirmScreenProps = CompositeScreenProps<
  StackScreenProps<HomeStackParamList, 'BookingConfirm'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type MyBookingsScreenProps = CompositeScreenProps<
  StackScreenProps<BookingsStackParamList, 'MyBookings'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type BookingDetailsScreenProps = CompositeScreenProps<
  StackScreenProps<BookingsStackParamList, 'BookingDetails'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileScreenProps = CompositeScreenProps<
  StackScreenProps<ProfileStackParamList, 'Profile'>,
  BottomTabScreenProps<MainTabParamList>
>;
