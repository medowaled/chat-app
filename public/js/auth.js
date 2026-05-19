document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth Script Loaded');

    // Check if already logged in
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
      window.location.href = 'login.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const errorBox = document.getElementById('error-box');

    // Toggle Forms
    document.getElementById('toRegister').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Switching to Register');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Join A&E Chat';
    });

    document.getElementById('toLogin').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Switching to Login');
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authTitle.textContent = 'Welcome Back';
    });

    // Login Action
    document.getElementById('loginBtn').addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent page refresh
        console.log('Login Button Clicked');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        if (!email || !password) {
            showError('Please fill all fields');
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                console.log('Login Success');
                localStorage.setItem('token', data.token); // Save token exactly as requested
                window.location.href = '/index.html'; // Force redirect
            } else {
                console.warn('Login Failed:', data.message);
                showError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login Error:', err);
            showError('Server connection failed');
        }
    });

    // Register Action
    document.getElementById('regBtn').addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent page refresh
        console.log('Register Button Clicked');
        const username = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;

        if (!username || !email || !password) {
            showError('Please fill all fields');
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                console.log('Registration Success');
                localStorage.setItem('token', data.token); // Save token
                window.location.href = '/index.html'; // Force redirect
            } else {
                console.warn('Registration Failed:', data.message);
                showError(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            showError('Server connection failed');
        }
    });

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }
});
