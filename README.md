<div style="display: flex; gap: 20px; flex-wrap: nowrap;">
  <img src="https://github.com/user-attachments/assets/b84bab12-2d01-4d7d-b1bb-a5f72a1d6a9d" width="48%" />
  <img src="https://github.com/user-attachments/assets/328e5fdd-6e60-4b70-bf27-b7e84c549889" width="48%" />
</div>

# BullSpace

A mobile room booking app built to solve the frustration of finding and reserving available rooms on campus. Instead of walking floor to floor checking doors, students can browse, book, and get real-time availability updates from their phone.

## Why I Built This

At University of South Florida, certain buildings offer study rooms on a first come first serve basis, which creates a frustrating experience for students. You have no way to know if a room is available without walking there and checking yourself. This wastes time and often leads to awkward situations where multiple students show up for the same room. Students can't plan their study sessions in advance, and conflicts over spaces happen constantly. BullRoom fixes this by letting students check availability and book rooms directly from their phones, eliminating the guesswork and the competition for space.


## Tech Stack

<div align="center">
<table>
<tr>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="65" height="65" alt="React Native" />
<br><strong>React Native</strong>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="65" height="65" alt="Node.js" />
<br><strong>Node.js</strong>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="65" height="65" alt="Express" />
<br><strong>Express</strong>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="65" height="65" alt="MongoDB" />
<br><strong>MongoDB</strong>
</td>
</tr>
<tr>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="65" height="65" alt="Redis" />
<br><strong>Redis</strong>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg" width="65" height="65" alt="RabbitMQ" />
<br><strong>RabbitMQ</strong>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="65" height="65" alt="Socket.io" />
<br><strong>Socket.io</strong>
</td>
<td align="center" width="140">
<img src="https://clerk.com/_next/image?url=%2Fimages%2Fclerk-logomark.svg&w=256&q=75" width="65" height="65" alt="Clerk" />
<br><strong>Clerk</strong>
</td>
</tr>
</table>
</div>

## Architecture
<img width="5729" height="8192" alt="mermaid-ai-diagram-2026-02-05-185714" src="https://github.com/user-attachments/assets/1cd168d8-a7c6-4e76-9286-7985e74153f0" />

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



