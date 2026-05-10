module.exports = (io) => {
    // Store connected users (socket.id -> userId)
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);

        // Handle user connecting and going online
        socket.on('user_online', (userId) => {
            connectedUsers.set(socket.id, userId);

            // Setup room for this user to receive direct messages easily
            socket.join(userId);

            // Broadcast to everybody that this user is online
            io.emit('user_status_change', { userId, status: 'online' });
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            // data: { senderId, receiverId, isTyping }
            if (data.receiverId) {
                socket.to(data.receiverId).emit('typing', data);
            } else {
                socket.broadcast.emit('typing', data);
            }
        });

        // Handle new message
        socket.on('send_message', (messageData) => {
            // Broadcast the message immediately
            if (messageData.receiverId) {
                // Send to specific user
                socket.to(messageData.receiverId).emit('receive_message', messageData);
            } else {
                // Broadcast to all
                socket.broadcast.emit('receive_message', messageData);
            }
        });

        // Handle message status (read receipts: sent, delivered, seen)
        socket.on('message_status', (data) => {
            // data: { messageId, senderId, receiverId, status }
            if (data.senderId) {
                socket.to(data.senderId).emit('message_status_update', data);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Disconnected: ${socket.id}`);
            const userId = connectedUsers.get(socket.id);
            if (userId) {
                connectedUsers.delete(socket.id);
                // Mark user offline
                io.emit('user_status_change', { userId, status: 'offline', lastSeen: new Date() });
            }
        });
    });
};
