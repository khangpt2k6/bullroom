<div style="display: flex; gap: 20px; flex-wrap: nowrap;">
  <img src="https://github.com/user-attachments/assets/b84bab12-2d01-4d7d-b1bb-a5f72a1d6a9d" width="48%" />
  <img src="https://github.com/user-attachments/assets/328e5fdd-6e60-4b70-bf27-b7e84c549889" width="48%" />
</div>

# BullRoom

A mobile room booking app built to solve the frustration of finding and reserving available rooms on campus. Instead of walking floor to floor checking doors, students can browse, book, and get real-time availability updates from their phone.

## Why I Built This

At University of South Florida, certain buildings offer study rooms on a first come first serve basis, which creates a frustrating experience for students. You have no way to know if a room is available without walking there and checking yourself. This wastes time and often leads to awkward situations where multiple students show up for the same room. Students can't plan their study sessions in advance, and conflicts over spaces happen constantly. BullRoom fixes this by letting students check availability and book rooms directly from their phones, eliminating the guesswork and the competition for space.


## Tech Stack

- **Frontend**: React Native (Expo), React Navigation, React Native Paper
- **Backend**: Node.js, Express (microservices architecture)
- **Database**: MongoDB, Redis (caching + atomic locks)
- **Messaging**: RabbitMQ (async booking processing)
- **Real-time**: Socket.io (live room status updates)
- **Auth**: Clerk
- **Email**: Resend

## Architecture
Architecture: 
<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/496c6ef4-9e91-4d1d-b010-9fe3d1b43d41" />

## How to Run


### Backend

```bash
# Install shared dependencies
cd backend && npm install

# Start each service (in separate terminals)
cd backend/api-gateway && npm install && npx nodemon server.ts
cd backend/booking-service && npm install && npx nodemon server.ts
cd backend/notification-service && npm install && npx nodemon server.ts
```
### Frontend

```bash
cd frontend && npm install
npx expo start
```

Scan the QR code with Expo Go (press `s` to switch to Expo Go mode).

