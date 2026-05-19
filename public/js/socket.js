// Connect to the generic socket.io namespace
const socket = io('https://eng-ahmedwalid-ae-chat-server.hf.space');

socket.on('connect', () => {
    console.log('Connected to socket server');
    const userId = state.currentUser.id || state.currentUser._id;
    socket.emit('user_online', userId);
});

socket.on('auth_success', (userData) => {
    state.currentUser = userData;
    if (elements.userBadge) {
        elements.userBadge.style.display = 'block';
        elements.displayEmail.textContent = userData.email;
    }
    console.log('Logged in as:', userData.email);
});

socket.on('auth_error', (error) => {
    console.error('Auth error:', error);
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

function sendTextMessage(text) {
    const currentUserId = state.currentUser.id || state.currentUser._id;
    const msg = {
        id: 'm_' + Date.now(),
        senderId: currentUserId,
        senderName: state.currentUser.name || state.currentUser.username,
        receiverId: state.activeContactId,
        content: text,
        timestamp: Date.now(),
        status: 'sent'
    };
    sendMessageViaSocket(msg);
}

function sendMessageViaSocket(msg) {
    if (!state.messages[msg.receiverId]) {
        state.messages[msg.receiverId] = [];
    }
    state.messages[msg.receiverId].push(msg);

    appendMessageToDOM(msg);
    socket.emit('send_message', msg);
}

socket.on('receive_message', (msg) => {
    console.log('Received message:', msg);
    const room = msg.senderId;
    if (!state.messages[room]) state.messages[room] = [];
    
    state.messages[room].push({
        id: msg.id || msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content,
        timestamp: msg.timestamp,
        status: 'seen'
    });
    
    if (state.activeContactId === room) {
        renderMessages(room);
    }
});

socket.on('previousMessages', (logs) => {
    console.log('Loaded history:', logs.length);
    logs.forEach(msg => {
        const room = msg.room === 'general' ? 'general' : (msg.sender === (state.currentUser.id || state.currentUser._id) ? msg.room : msg.sender);
        
        if (!state.messages[room]) state.messages[room] = [];
        
        if (!state.messages[room].some(m => m.id === msg._id)) {
            state.messages[room].push({
                id: msg._id,
                senderId: msg.sender,
                senderName: msg.senderName,
                content: msg.content,
                timestamp: msg.timestamp,
                status: 'seen'
            });
        }
    });
    
    if (state.activeContactId) {
        renderMessages(state.activeContactId);
    }
});

function fetchChatHistory(contactId) {
    socket.emit('get_history', contactId);
}

socket.on('user_status_change', (data) => {
    const { userId, status } = data;
    const contact = state.contacts.find(c => c.id === userId);
    if (contact) {
        contact.isOnline = (status === 'online');
        renderContacts(elements.searchInput.value);
        if (state.activeContactId === userId) {
            elements.activeChatStatus.innerHTML = (contact.isOnline ? '<span class="online-dot"></span> Online' : 'Offline');
        }
    }
});

socket.on('typing', (data) => {
    if (data.senderId === state.activeContactId) {
        if (elements.typingIndicator) {
            elements.typingIndicator.style.display = data.isTyping ? 'flex' : 'none';
        }
    }
});

socket.on('incoming_call', (data) => {
    console.log('Incoming call:', data);
    window.currentIncomingCall = data;
    if (elements.incomingCallName) elements.incomingCallName.textContent = data.callerName;
    if (elements.incomingCallAvatar) elements.incomingCallAvatar.src = data.callerAvatar;
    if (elements.incomingCallType) elements.incomingCallType.textContent = `Incoming ${data.type} Call...`;
    if (elements.incomingCallModal) elements.incomingCallModal.style.display = 'flex';
});

socket.on('call_accepted', () => {
    console.log('Call accepted');
    if (elements.callModalText) elements.callModalText.textContent = `Active Call...`;
    if (window.startCallTimer) window.startCallTimer();
});

socket.on('call_declined', () => {
    console.log('Call declined');
    if (elements.callModalText) elements.callModalText.textContent = 'Call Declined';
    setTimeout(() => {
        if (elements.callModal) elements.callModal.style.display = 'none';
    }, 2000);
});

socket.on('call_ended', () => {
    console.log('Call ended');
    if (elements.callModalText) elements.callModalText.textContent = 'Call Ended';
    if (window.stopCallTimer) window.stopCallTimer();
    setTimeout(() => {
        if (elements.callModal) elements.callModal.style.display = 'none';
    }, 2000);
});
