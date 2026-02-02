import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { USF_GREEN } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">Not logged in</Text>
      </View>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(user.name)}
              style={{ backgroundColor: USF_GREEN }}
            />
          </View>

          <Text variant="headlineSmall" style={styles.name}>
            {user.name}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user.email}
          </Text>
          <Text variant="bodySmall" style={styles.role}>
            {user.role === 'student' ? 'Student' : 'Administrator'}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>User ID:</Text>
              <Text variant="bodyMedium" style={styles.value}>{user._id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Email:</Text>
              <Text variant="bodyMedium" style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Role:</Text>
              <Text variant="bodyMedium" style={styles.value}>
                {user.role === 'student' ? 'Student' : 'Administrator'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        textColor="#F44336"
        icon="logout"
      >
        Logout
      </Button>

      <Text variant="bodySmall" style={styles.version}>
        BullRoom v1.0.0
      </Text>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: USF_GREEN,
    marginBottom: 4,
  },
  email: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  role: {
    textAlign: 'center',
    color: '#999',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  divider: {
    marginVertical: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderColor: '#F44336',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
    marginBottom: 32,
  },
});
