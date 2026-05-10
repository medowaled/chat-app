// Early Auth Check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

// Global State
const state = {
    currentUser: { id: '', name: 'User', avatar: '' },
    activeContactId: null,
    contacts: [
        { id: '1', name: 'Alice Smith', lastMessage: 'Hey, are we still on?', time: '10:42 AM', unread: 2, isOnline: true },
        { id: '2', name: 'Bob Jones', lastMessage: 'Sent an attachment', time: 'Yesterday', unread: 0, isOnline: false },
        { id: '3', name: 'Design Team', lastMessage: 'The new UI looks great!', time: 'Friday', unread: 5, isOnline: true }
    ],
    messages: {},
    stories: []
};

// DOM Elements
const elements = {
    contactList: document.getElementById('contactList'),
    noChatSelected: document.getElementById('noChatSelected'),
    activeChat: document.getElementById('activeChat'),
    activeChatName: document.getElementById('activeChatName'),
    activeChatStatus: document.getElementById('activeChatStatus'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    attachBtn: document.getElementById('attachBtn'),
    mediaUpload: document.getElementById('mediaUpload'),
    searchInput: document.getElementById('searchInput'),
    currentUserAvatar: document.getElementById('currentUserAvatar'),
    profilePicUpload: document.getElementById('profilePicUpload'),
    myProfilePic: document.getElementById('myProfilePic'),
    sidebarMenuBtn: document.getElementById('sidebar-menu-btn'),
    mainMenuDropdown: document.getElementById('mainMenuDropdown'),
    recordingTimer: document.getElementById('recordingTimer'),
    recordTimeDisplay: document.getElementById('recordTimeDisplay'),
    optProfile: document.getElementById('opt-profile'),
    optSettings: document.getElementById('opt-settings'),
    optLogout: document.getElementById('opt-logout'),
    optNewGroup: document.getElementById('opt-new-group'),
    optDarkMode: document.getElementById('opt-dark-mode'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    profileModal: document.getElementById('profileModal'),
    profileModalTitle: document.getElementById('profileModalTitle'),
    closeProfileBtn: document.getElementById('closeProfileBtn'),
    logoutModal: document.getElementById('logoutModal'),
    confirmLogoutBtn: document.getElementById('confirmLogoutBtn'),
    cancelLogoutBtn: document.getElementById('cancelLogoutBtn'),
    videoCallBtn: document.getElementById('videoCallBtn'),
    callBtn: document.getElementById('callBtn'),
    callModal: document.getElementById('callModal'),
    callModalText: document.getElementById('callModalText'),
    endCallBtn: document.getElementById('endCallBtn'),
    storiesContainer: document.getElementById('storiesContainer'),
    chatMenuBtn: document.getElementById('chat-menu-btn'),
    headerMenuDropdown: document.getElementById('headerMenuDropdown'),
    bgColorPicker: document.getElementById('bgColorPicker'),
    wallpaperUpload: document.getElementById('wallpaperUpload'),
    removeWallpaperBtn: document.getElementById('removeWallpaperBtn'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    editUsername: document.getElementById('editUsername'),
    editStatus: document.getElementById('editStatus'),
    profileModalPic: document.getElementById('profileModalPic'),
    groupModal: document.getElementById('groupModal'),
    closeGroupBtn: document.getElementById('closeGroupBtn'),
    createGroupBtn: document.getElementById('createGroupBtn'),
    groupNameInput: document.getElementById('groupNameInput'),
    headerSearchBtn: document.getElementById('headerSearchBtn'),
    chatSearchBox: document.getElementById('chatSearchBox'),
    chatSearchInput: document.getElementById('chatSearchInput'),
    optClearChat: document.getElementById('opt-clear-chat'),
    optContactInfo: document.getElementById('opt-contact-info'),
    textStoryModal: document.getElementById('textStoryModal'),
    closeTextStoryBtn: document.getElementById('closeTextStoryBtn'),
    storyTextInput: document.getElementById('storyTextInput'),
    changeStoryBgBtn: document.getElementById('changeStoryBgBtn'),
    postTextStoryBtn: document.getElementById('postTextStoryBtn'),
    textStoryEditor: document.getElementById('textStoryEditor'),
    storyUpload: document.createElement('input')
};
elements.storyUpload.type = 'file';
elements.storyUpload.accept = 'image/*,video/*';

async function initApp() {
    // Dark Mode restore
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
        elements.optDarkMode.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
    }

    await fetchUserData();
    renderContacts();
    fetchStories();
    attachEventListeners();
    if (typeof socket !== 'undefined') {
        socket.emit('authenticate', token);
    }
    const savedBg = localStorage.getItem('chatBg');
    if (savedBg) elements.chatMessages.style.backgroundImage = `url(${savedBg})`;
}

async function fetchUserData() {
    try {
        const res = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            state.currentUser = data.user;
            if (elements.myProfilePic) elements.myProfilePic.src = data.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            if (elements.profileModalPic) elements.profileModalPic.src = data.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        }
    } catch (err) { console.error('Fetch user data failed'); }
}

async function fetchStories() {
    try {
        const res = await fetch('/api/stories');
        state.stories = await res.json();
        renderStories();
    } catch (err) { console.error('Fetch stories failed'); }
}

function renderContacts(filter = '') {
    if (!elements.contactList) return;
    elements.contactList.innerHTML = '';
    const filtered = state.contacts.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(contact => {
        const div = document.createElement('div');
        div.className = `contact-item ${state.activeContactId === contact.id ? 'active' : ''}`;
        div.onclick = () => selectContact(contact.id);
        const avatar = contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`;
        div.innerHTML = `
            <div class="user-avatar"><img src="${avatar}"></div>
            <div class="contact-info">
                <div class="top-row"><h4>${contact.name}</h4><span class="time">${contact.time}</span></div>
                <div class="bottom-row"><span class="last-msg">${contact.lastMessage}</span>${contact.unread ? `<span class="unread-badge">${contact.unread}</span>` : ''}</div>
            </div>
        `;
        elements.contactList.appendChild(div);
    });
}

function renderStories() {
    if (!elements.storiesContainer) return;
    elements.storiesContainer.innerHTML = '';
    const myAvatar = state.currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const myStory = document.createElement('div');
    myStory.className = 'story-item';
    myStory.innerHTML = `<div class="story-avatar mine"><img src="${myAvatar}"><div class="add-story-icon"><i class="fa-solid fa-plus"></i></div></div><span>Status</span>`;
    myStory.onclick = () => elements.storyUpload.click();
    elements.storiesContainer.appendChild(myStory);

    const myTextStory = document.createElement('div');
    myTextStory.className = 'story-item';
    myTextStory.innerHTML = `<div class="story-avatar mine" style="background:#1a4a7c; display:flex; justify-content:center; align-items:center;"><i class="fa-solid fa-pencil" style="color:white; font-size:1.2rem;"></i></div><span>Write</span>`;
    myTextStory.onclick = () => elements.textStoryModal.style.display = 'flex';
    elements.storiesContainer.appendChild(myTextStory);

    state.stories.forEach(story => {
        const div = document.createElement('div');
        div.className = 'story-item';
        let thumb = story.type === 'text' ? `<div class="story-avatar" style="background:${story.backgroundColor}; display:flex; justify-content:center; align-items:center; color:white; font-size:0.6rem; padding:5px; text-align:center;">${story.content.substring(0,20)}...</div>` : `<div class="story-avatar"><img src="${story.mediaUrl}"></div>`;
        div.innerHTML = `${thumb}<span>${story.userName}</span>`;
        div.onclick = () => showStoryView(story);
        elements.storiesContainer.appendChild(div);
    });
}

function showStoryView(story) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex'; overlay.style.zIndex = '2000';
    overlay.onclick = () => document.body.removeChild(overlay);
    const content = document.createElement('div');
    content.style.maxWidth = '400px'; content.style.width = '100%'; content.style.height = '80vh';
    content.style.background = story.backgroundColor || 'black';
    content.style.borderRadius = '20px'; content.style.position = 'relative';
    content.style.display = 'flex'; content.style.justifyContent = 'center'; content.style.alignItems = 'center';
    content.style.padding = '40px'; content.style.color = 'white'; content.style.textAlign = 'center'; content.style.overflow = 'hidden';

    if (story.type === 'text') content.innerHTML = `<h2 style="font-size:2rem; font-weight:600;">${story.content}</h2>`;
    else if (story.type === 'video') content.innerHTML = `<video src="${story.mediaUrl}" autoplay controls style="max-width:100%; max-height:100%; border-radius:10px;"></video>`;
    else content.innerHTML = `<img src="${story.mediaUrl}" style="max-width:100%; max-height:100%; border-radius:10px; object-fit:contain;">`;

    const nameTag = document.createElement('div');
    nameTag.style.position = 'absolute'; nameTag.style.top = '20px'; nameTag.style.left = '20px'; nameTag.style.fontWeight = '600';
    nameTag.textContent = story.userName; content.appendChild(nameTag);
    overlay.appendChild(content); document.body.appendChild(overlay);
}

function selectContact(id) {
    state.activeContactId = id;
    const contact = state.contacts.find(c => c.id === id);
    if (contact) contact.unread = 0;
    document.body.classList.add('chat-active');
    renderContacts(); showChatArea(contact);
    if (typeof fetchChatHistory === 'function') fetchChatHistory(id);
}

function showChatArea(contact) {
    elements.noChatSelected.style.display = 'none'; elements.activeChat.style.display = 'flex';
    elements.activeChatName.textContent = contact.name;
    elements.activeChatStatus.textContent = contact.isOnline ? 'Online' : 'Last seen recently';
    const avatar = contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`;
    document.getElementById('activeChatAvatar').src = avatar;
    
    const wallMap = JSON.parse(localStorage.getItem('chatWallpapers') || '{}');
    if (wallMap[contact.id]) {
        elements.chatMessages.style.backgroundImage = `url(${wallMap[contact.id]})`;
        elements.chatMessages.style.backgroundColor = 'transparent';
    } else {
        elements.chatMessages.style.backgroundImage = 'none';
        elements.chatMessages.style.backgroundColor = 'var(--bg-chat)';
    }

    renderMessages(contact.id);
    setTimeout(() => scrollToBottom(), 50);
}

function renderMessages(contactId, filter = '') {
    elements.chatMessages.innerHTML = '';
    let msgs = state.messages[contactId] || [];
    if (filter) msgs = msgs.filter(m => m.content && m.content.toLowerCase().includes(filter.toLowerCase()));
    msgs.forEach(msg => appendMessageToDOM(msg));
}

function appendMessageToDOM(msg) {
    if (!elements.chatMessages) return;
    const div = document.createElement('div');
    const currentUserId = state.currentUser.id || state.currentUser._id;
    const isMine = String(msg.senderId || msg.sender) === String(currentUserId);
    div.className = `message ${isMine ? 'message-out' : 'message-in'}`;
    const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let mediaHTML = '';
    if (msg.mediaUrl) {
        if (msg.mediaUrl.toLowerCase().includes('.mp4') || msg.mediaUrl.toLowerCase().includes('.webm')) mediaHTML = `<video controls style="max-width:100%; border-radius:8px; margin-bottom:5px;"><source src="${msg.mediaUrl}"></video>`;
        else if (msg.mediaUrl.toLowerCase().includes('.mp3') || msg.mediaUrl.includes('voice')) mediaHTML = `<audio controls style="max-width:200px; height:40px;"><source src="${msg.mediaUrl}"></audio>`;
        else mediaHTML = `<img src="${msg.mediaUrl}" style="max-width:100%; border-radius:8px; cursor:pointer;" onclick="window.open('${msg.mediaUrl}','_blank')">`;
    }

    // Add tiny avatar to messages
    const senderAvatar = isMine ? (state.currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png') : (msg.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');

    div.innerHTML = `
        ${!isMine ? `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;"><img src="${senderAvatar}" style="width:20px; height:20px; border-radius:50%;"><div class="sender-name">${msg.senderName || 'Contact'}</div></div>` : ''}
        ${mediaHTML}${msg.content ? `<span>${msg.content}</span>` : ''}
        <div class="meta"><span>${timeStr}</span>${isMine ? '<i class="fa-solid fa-check-double seen read-receipt"></i>' : ''}</div>
    `;
    elements.chatMessages.appendChild(div); scrollToBottom();
}

function scrollToBottom() { if (elements.chatMessages) elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight; }

let mediaRecorder; let audioChunks = []; let isRecording = false;
async function toggleRecording() {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream); audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData(); formData.append('media', audioBlob, 'voice_note.webm');
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json(); if (data.success) sendMediaMessage(data.url);
            };
            mediaRecorder.start(); isRecording = true;
            elements.recordingTimer.style.display = 'flex'; elements.messageInput.style.display = 'none';
            elements.voiceBtn.innerHTML = '<i class="fa-solid fa-stop" style="color:red"></i>';
        } catch (err) { alert('Microphone access denied'); }
    } else { if (mediaRecorder) mediaRecorder.stop(); isRecording = false; elements.recordingTimer.style.display = 'none'; elements.messageInput.style.display = 'block'; elements.voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; }
}

function sendMediaMessage(url) {
    const msg = { id: 'm_' + Date.now(), senderId: state.currentUser.id || state.currentUser._id, senderName: state.currentUser.username || state.currentUser.name, senderAvatar: state.currentUser.avatar, receiverId: state.activeContactId, mediaUrl: url, timestamp: Date.now() };
    if (typeof sendMessageViaSocket === 'function') sendMessageViaSocket(msg);
}

function handleSendMessage() {
    const text = elements.messageInput.value.trim(); if (!text) return;
    if (typeof sendTextMessage === 'function') sendTextMessage(text); elements.messageInput.value = '';
}

function attachEventListeners() {
    elements.sendBtn.onclick = handleSendMessage; elements.messageInput.onkeypress = e => { if (e.key === 'Enter') handleSendMessage(); };
    elements.attachBtn.onclick = () => elements.mediaUpload.click();
    elements.mediaUpload.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append('media', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json(); if (data.success) sendMediaMessage(data.url);
    };

    elements.storyUpload.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append('story', file);
        formData.append('userId', state.currentUser.id || state.currentUser._id);
        formData.append('userName', state.currentUser.username || state.currentUser.name);
        await fetch('/api/stories', { method: 'POST', body: formData }); fetchStories();
    };

    const storyColors = ['#1a4a7c', '#c5a028', '#1e293b', '#e53935', '#4caf50', '#9c27b0']; let colorIdx = 0;
    elements.changeStoryBgBtn.onclick = () => { colorIdx = (colorIdx + 1) % storyColors.length; elements.textStoryEditor.style.background = storyColors[colorIdx]; };
    elements.postTextStoryBtn.onclick = async () => {
        const text = elements.storyTextInput.value.trim(); if (!text) return;
        const res = await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: state.currentUser.id || state.currentUser._id, userName: state.currentUser.username || state.currentUser.name, type: 'text', content: text, backgroundColor: elements.textStoryEditor.style.background }) });
        if ((await res.json()).success) { elements.textStoryModal.style.display = 'none'; elements.storyTextInput.value = ''; fetchStories(); }
    };
    elements.closeTextStoryBtn.onclick = () => elements.textStoryModal.style.display = 'none';

    elements.voiceBtn.onclick = toggleRecording;
    elements.searchInput.oninput = (e) => renderContacts(e.target.value);
    elements.headerSearchBtn.onclick = () => { elements.chatSearchBox.style.display = elements.chatSearchBox.style.display === 'none' ? 'block' : 'none'; if (elements.chatSearchBox.style.display === 'block') elements.chatSearchInput.focus(); };
    elements.chatSearchInput.oninput = (e) => renderMessages(state.activeContactId, e.target.value);

    const closeDropdowns = () => { if (elements.mainMenuDropdown) elements.mainMenuDropdown.classList.remove('show'); if (elements.headerMenuDropdown) elements.headerMenuDropdown.classList.remove('show'); };
    if (elements.sidebarMenuBtn) elements.sidebarMenuBtn.onclick = (e) => { e.stopPropagation(); closeDropdowns(); elements.mainMenuDropdown.classList.toggle('show'); };
    if (elements.chatMenuBtn) elements.chatMenuBtn.onclick = (e) => { e.stopPropagation(); closeDropdowns(); elements.headerMenuDropdown.classList.toggle('show'); };
    document.addEventListener('click', closeDropdowns);

    if (elements.optProfile) elements.optProfile.onclick = () => { elements.profileModalTitle.textContent = "Profile Info"; elements.editUsername.value = state.currentUser.username || state.currentUser.name; elements.editUsername.disabled = false; elements.editStatus.disabled = false; elements.saveProfileBtn.style.display = 'block'; elements.profileModalPic.src = state.currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; if (elements.profileModal) elements.profileModal.style.display = 'flex'; };
    if (elements.optContactInfo) elements.optContactInfo.onclick = () => { const contact = state.contacts.find(x => x.id === state.activeContactId); if (!contact) return; elements.profileModalTitle.textContent = "Contact Info"; elements.editUsername.value = contact.name; elements.editUsername.disabled = true; elements.editStatus.value = contact.status || "Hey there! I am using A&E Chat."; elements.editStatus.disabled = true; elements.saveProfileBtn.style.display = 'none'; elements.profileModalPic.src = contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`; if (elements.profileModal) elements.profileModal.style.display = 'flex'; };

    if (elements.optNewGroup) elements.optNewGroup.onclick = () => { if (elements.groupModal) elements.groupModal.style.display = 'flex'; };
    if (elements.closeGroupBtn) elements.closeGroupBtn.onclick = () => { elements.groupModal.style.display = 'none'; };
    if (elements.createGroupBtn) {
        elements.createGroupBtn.onclick = () => { const groupName = elements.groupNameInput.value.trim(); if (groupName) { const newGroup = { id: 'g_' + Date.now(), name: groupName, lastMessage: 'Group created', time: 'Just now', unread: 0, isGroup: true }; state.contacts.unshift(newGroup); renderContacts(); elements.groupModal.style.display = 'none'; elements.groupNameInput.value = ''; } };
    }

    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.onclick = async () => {
            const newName = elements.editUsername.value.trim();
            const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: state.currentUser.id || state.currentUser._id, username: newName }) });
            const data = await res.json(); if (data.success) { state.currentUser.username = newName; state.currentUser.name = newName; alert('Profile updated successfully!'); elements.profileModal.style.display = 'none'; }
        };
    }
    if (elements.closeProfileBtn) elements.closeProfileBtn.onclick = () => { elements.profileModal.style.display = 'none'; };
    if (elements.optSettings) elements.optSettings.onclick = () => { if (elements.settingsModal) elements.settingsModal.style.display = 'flex'; };
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.onclick = () => { elements.settingsModal.style.display = 'none'; };
    
    if (elements.optDarkMode) {
        elements.optDarkMode.onclick = () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('dark-mode', isDark ? 'enabled' : 'disabled');
            elements.optDarkMode.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
        };
    }

    if (elements.bgColorPicker) elements.bgColorPicker.oninput = (e) => { elements.chatMessages.style.backgroundColor = e.target.value; elements.chatMessages.style.backgroundImage = 'none'; if (state.activeContactId) { const wallMap = JSON.parse(localStorage.getItem('chatWallpapers') || '{}'); delete wallMap[state.activeContactId]; localStorage.setItem('chatWallpapers', JSON.stringify(wallMap)); } };
    if (elements.wallpaperUpload) {
        elements.wallpaperUpload.onchange = async (e) => {
            const file = e.target.files[0]; if (!file || !state.activeContactId) return;
            const formData = new FormData(); formData.append('media', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                elements.chatMessages.style.backgroundImage = `url(${data.url})`;
                elements.chatMessages.style.backgroundColor = 'transparent';
                const wallMap = JSON.parse(localStorage.getItem('chatWallpapers') || '{}');
                wallMap[state.activeContactId] = data.url;
                localStorage.setItem('chatWallpapers', JSON.stringify(wallMap));
            }
        };
    }
    if (elements.removeWallpaperBtn) elements.removeWallpaperBtn.onclick = () => { elements.chatMessages.style.backgroundImage = 'none'; elements.chatMessages.style.backgroundColor = 'var(--bg-chat)'; if (state.activeContactId) { const wallMap = JSON.parse(localStorage.getItem('chatWallpapers') || '{}'); delete wallMap[state.activeContactId]; localStorage.setItem('chatWallpapers', JSON.stringify(wallMap)); } };

    if (elements.optLogout) elements.optLogout.onclick = () => { if (elements.logoutModal) elements.logoutModal.style.display = 'flex'; };
    if (elements.cancelLogoutBtn) elements.cancelLogoutBtn.onclick = () => { elements.logoutModal.style.display = 'none'; };
    if (elements.confirmLogoutBtn) {
        elements.confirmLogoutBtn.onclick = () => { localStorage.removeItem('token'); window.location.href = '/login.html'; };
    }

    if (elements.optClearChat) elements.optClearChat.onclick = () => { if (state.activeContactId) { state.messages[state.activeContactId] = []; renderMessages(state.activeContactId); } };

    const startCall = (type) => { const contact = state.contacts.find(x => x.id === state.activeContactId); if (elements.callModalText) elements.callModalText.textContent = `${type} Calling ${contact ? contact.name : 'User'}...`; if (elements.callModal) elements.callModal.style.display = 'flex'; };
    if (elements.videoCallBtn) elements.videoCallBtn.onclick = () => startCall('Video');
    if (elements.callBtn) elements.callBtn.onclick = () => startCall('Voice');
    if (elements.endCallBtn) elements.endCallBtn.onclick = () => { elements.callModal.style.display = 'none'; };

    if (elements.profileModalPic) {
        elements.profileModalPic.onclick = () => { if (elements.profileModalTitle.textContent === "Profile Info") elements.profilePicUpload.click(); };
    }
    if (elements.profilePicUpload) {
        elements.profilePicUpload.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const formData = new FormData(); formData.append('media', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: state.currentUser.id || state.currentUser._id, avatarUrl: data.url }) });
                state.currentUser.avatar = data.url; if (elements.myProfilePic) elements.myProfilePic.src = data.url; if (elements.profileModalPic) elements.profileModalPic.src = data.url; renderStories();
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', initApp);
