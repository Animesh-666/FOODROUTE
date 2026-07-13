/**
 * =================================================
 * Auth JavaScript
 * =================================================
 * 
 * Logic for login, signup, and authentication checks.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    redirectIfLoggedIn();

    // Set up form listeners
    setupLoginForm();
    setupSignupForm();
    setupAdminLoginForm();
    setupDeliveryLoginForm();
    setupAdminSignupForm();
    setupDeliverySignupForm();
});

/**
 * Redirect users if they are already logged in
 */
function redirectIfLoggedIn() {
    if (Auth.isLoggedIn()) {
        const user = Auth.getUser();
        if (user) {
            redirectBasedOnRole(user.role);
        }
    }
}

/**
 * Redirect user to their appropriate dashboard
 * @param {string} role 
 */
function redirectBasedOnRole(role) {
    switch (role) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'delivery_agent':
            window.location.href = 'delivery-dashboard.html';
            break;
        case 'customer':
        default:
            window.location.href = 'customer-dashboard.html';
            break;
    }
}

/**
 * Toggle password visibility
 * @param {string} inputId - ID of password input
 */
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

/**
 * Handle Standard Login
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!loginForm.checkValidity()) {
            e.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/login', { email, password });
            
            Auth.setToken(data.token);
            showToast('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                redirectBasedOnRole(data.user.role);
            }, 1000);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * Handle Admin Login
 */
function setupAdminLoginForm() {
    const adminForm = document.getElementById('adminLoginForm');
    if (!adminForm) return;

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!adminForm.checkValidity()) {
            e.stopPropagation();
            adminForm.classList.add('was-validated');
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/login', { email, password });
            
            if (data.user.role !== 'admin') {
                Auth.removeToken();
                showToast('Access denied. Admin privileges required.', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            Auth.setToken(data.token);
            showToast('Admin login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * Handle Delivery Agent Login
 */
function setupDeliveryLoginForm() {
    const deliveryForm = document.getElementById('deliveryLoginForm');
    if (!deliveryForm) return;

    deliveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!deliveryForm.checkValidity()) {
            e.stopPropagation();
            deliveryForm.classList.add('was-validated');
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/login', { email, password });
            
            if (data.user.role !== 'delivery_agent' && data.user.role !== 'admin') {
                Auth.removeToken();
                showToast('Access denied. Agent privileges required.', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            Auth.setToken(data.token);
            showToast('Agent login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'delivery-dashboard.html';
            }, 1000);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * Handle Signup
 */
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    // Password match validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', () => {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!signupForm.checkValidity()) {
            e.stopPropagation();
            signupForm.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const passwordValue = password.value;
        const btn = document.getElementById('signupBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Account...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/signup', { 
                name, 
                email, 
                password: passwordValue,
                phone,
                role: 'customer'
            });
            
            Auth.setToken(data.token);
            showToast('Account created successfully! Welcome to FoodRoute.', 'success');
            
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 1500);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * Handle Admin Signup
 */
function setupAdminSignupForm() {
    const signupForm = document.getElementById('adminSignupForm');
    if (!signupForm) return;

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', () => {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!signupForm.checkValidity()) {
            e.stopPropagation();
            signupForm.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const passwordValue = password.value;
        const btn = document.getElementById('signupBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Admin...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/signup', { 
                name, 
                email, 
                password: passwordValue,
                phone,
                role: 'admin'
            });
            
            Auth.setToken(data.token);
            showToast('Admin Account Created!', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * Handle Delivery Agent Signup
 */
function setupDeliverySignupForm() {
    const signupForm = document.getElementById('deliverySignupForm');
    if (!signupForm) return;

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', () => {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!signupForm.checkValidity()) {
            e.stopPropagation();
            signupForm.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const passwordValue = password.value;
        const btn = document.getElementById('signupBtn');
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Account...';
        btn.disabled = true;

        try {
            const data = await ApiClient.post('/auth/signup', { 
                name, 
                email, 
                password: passwordValue,
                phone,
                role: 'delivery_agent'
            });
            
            Auth.setToken(data.token);
            showToast('Agent Account Created! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'delivery-dashboard.html';
            }, 1500);
            
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

