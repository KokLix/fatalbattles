// FatalBattles System - Vercel Optimized
class FatalBattlesSystem {
    constructor() {
        this.currentUser = null;
        this.users = {};
        this.currentStep = 1;
        this.dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours
        this.init();
    }

    init() {
        console.log('🚀 FatalBattles System Initialized on Vercel');
        this.loadUsers();
        this.checkAuth();
        this.setupEventListeners();
        this.setupServiceWorker();
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('🔧 Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('showRegisterBtn')?.addEventListener('click', () => this.showRegister());
        document.getElementById('showLoginBtn')?.addEventListener('click', () => this.showLogin());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

        // Mission Steps
        document.getElementById('completeStep1Btn')?.addEventListener('click', () => this.completeStep(1));
        document.getElementById('completeStep2Btn')?.addEventListener('click', () => this.completeStep(2));
        document.getElementById('completeStep3Btn')?.addEventListener('click', () => this.completeStep(3));
        document.getElementById('claimRewardBtn')?.addEventListener('click', () => this.claimDailyReward());

        // Step markers click
        document.querySelectorAll('.step-marker').forEach(marker => {
            marker.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.dataset.step);
                if (step <= this.currentStep) {
                    this.showStep(step);
                }
            });
        });
    }

    // User Management
    register(username, password) {
        if (this.users[username]) {
            return { success: false, message: 'Имя пользователя уже занято' };
        }

        if (username.length < 3) {
            return { success: false, message: 'Имя должно быть не менее 3 символов' };
        }

        if (password.length < 4) {
            return { success: false, message: 'Пароль должен быть не менее 4 символов' };
        }

        this.users[username] = {
            password: btoa(password),
            balance: 0,
            keysClaimed: 0,
            lastClaim: null,
            lastLinksUpdate: null,
            dailyProgress: {
                currentStep: 1,
                completedSteps: [],
                dailyLinks: this.generateDailyLinks()
            }
        };

        this.saveUsers();
        return { success: true, message: 'Аккаунт успешно создан!' };
    }

    login(username, password) {
        const user = this.users[username];
        if (!user || user.password !== btoa(password)) {
            return { success: false, message: 'Неверное имя пользователя или пароль' };
        }

        this.currentUser = username;
        this.loadUserProgress();
        this.saveCurrentUser();
        
        return { success: true, message: 'Добро пожаловать!' };
    }

    logout() {
        this.saveUserProgress();
        this.currentUser = null;
        this.clearCurrentUser();
        this.showAuth();
    }

    // Mission System
    generateDailyLinks() {
        console.log('🔗 Generating mission links for Vercel...');
        const links = {};
        const baseUrls = [
            'https://www.youtube.com',
            'https://www.github.com',
            'https://www.stackoverflow.com',
            'https://www.reddit.com',
            'https://www.twitter.com'
        ];

        for (let step = 1; step <= 3; step++) {
            const randomUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];
            links[step] = `${randomUrl}?ref=fatalbattles-vercel&mission=${step}&t=${Date.now()}`;
        }

        return links;
    }

    loadUserProgress() {
        const savedUser = localStorage.getItem('fatalbattles_user');
        if (savedUser && this.users[savedUser]) {
            this.currentUser = savedUser;
            const user = this.users[this.currentUser];
            this.currentStep = user.dailyProgress.currentStep || 1;

            // Check if links need refresh
            const now = Date.now();
            const lastUpdate = user.lastLinksUpdate || 0;
            
            if (!user.dailyProgress.dailyLinks || Object.keys(user.dailyProgress.dailyLinks).length === 0 || 
                (now - lastUpdate) > this.dailyCooldown) {
                console.log('🔄 Refreshing mission links for new day...');
                user.dailyProgress.dailyLinks = this.generateDailyLinks();
                user.lastLinksUpdate = now;
                user.dailyProgress.currentStep = 1;
                user.dailyProgress.completedSteps = [];
                this.currentStep = 1;
                this.saveUsers();
            }

            this.setupMissionLinks();
            return true;
        }
        return false;
    }

    setupMissionLinks() {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser];
        const links = user.dailyProgress.dailyLinks;

        for (let step = 1; step <= 3; step++) {
            const link = links[step];
            const btn = document.getElementById(`step${step}Btn`);
            const completeBtn = document.getElementById(`completeStep${step}Btn`);
            const statusElement = document.getElementById(`step${step}Status`);
            
            if (btn && this.isValidLink(link)) {
                btn.href = link;
                btn.style.display = 'flex';
            }
            
            if (completeBtn) {
                const isActive = step === this.currentStep;
                const isCompleted = user.dailyProgress.completedSteps.includes(step);
                
                completeBtn.disabled = !isActive || isCompleted;
                completeBtn.innerHTML = isCompleted ? 
                    '<span class="btn-icon">✅</span><span class="btn-text">Завершено</span>' : 
                    isActive ? 
                    '<span class="btn-icon">✅</span><span class="btn-text">Подтвердить переход</span>' : 
                    '<span class="btn-icon">⏳</span><span class="btn-text">Ожидание</span>';
            }
            
            if (statusElement) {
                if (user.dailyProgress.completedSteps.includes(step)) {
                    statusElement.textContent = '✅ Миссия завершена!';
                    statusElement.className = 'step-status success';
                } else if (step === this.currentStep) {
                    statusElement.textContent = '🔗 Перейдите по ссылке и вернитесь для подтверждения';
                    statusElement.className = 'step-status warning';
                } else {
                    statusElement.textContent = '⏳ Ожидание предыдущих миссий';
                    statusElement.className = 'step-status info';
                }
            }
        }

        this.updateProgress();
        this.updateUI();
        this.showStep(this.currentStep);
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected step
        const stepContent = document.querySelector(`.step-content[data-step="${step}"]`);
        if (stepContent) {
            stepContent.classList.add('active');
        }

        // Update markers
        document.querySelectorAll('.step-marker').forEach(marker => {
            const markerStep = parseInt(marker.dataset.step);
            marker.classList.remove('active');
            if (markerStep < this.currentStep) {
                marker.classList.add('completed');
            } else if (markerStep === this.currentStep) {
                marker.classList.add('active');
            }
        });
    }

    completeStep(step) {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser];
        
        if (user.dailyProgress.currentStep === step && 
            !user.dailyProgress.completedSteps.includes(step)) {
            
            user.dailyProgress.completedSteps.push(step);
            user.dailyProgress.currentStep = step + 1;
            this.currentStep = step + 1;
            
            this.saveUsers();
            this.setupMissionLinks();
            
            if (step === 3) {
                this.prepareReward();
            }
            
            console.log(`✅ Mission ${step} completed on Vercel`);
            this.showNotification(`Миссия ${step} завершена!`, 'success');
        }
    }

    prepareReward() {
        const dailyKey = this.generateDailyKey();
        document.getElementById('finalKey').textContent = dailyKey;
        document.getElementById('claimRewardBtn').disabled = false;
        document.getElementById('rewardStatus').textContent = '🎉 Все миссии выполнены! Получите награду.';
        this.showStep(4);
    }

    generateDailyKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) key += '-';
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    claimDailyReward() {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser];
        const now = Date.now();
        
        // Cooldown check
        if (user.lastClaim && (now - user.lastClaim) < this.dailyCooldown) {
            this.showCooldownTimer();
            this.showNotification('Вы уже получали награду сегодня. Возвращайтесь завтра!', 'warning');
            return;
        }

        // Mission completion check
        if (user.dailyProgress.completedSteps.length !== 3) {
            this.showNotification('Сначала завершите все 3 миссии!', 'error');
            return;
        }

        // Reward
        user.balance += 100;
        user.keysClaimed += 1;
        user.lastClaim = now;

        // Reset for next day
        user.dailyProgress.dailyLinks = this.generateDailyLinks();
        user.lastLinksUpdate = now;
        user.dailyProgress.currentStep = 1;
        user.dailyProgress.completedSteps = [];
        this.currentStep = 1;

        this.saveUsers();
        this.setupMissionLinks();
        this.updateUI();

        document.getElementById('rewardStatus').textContent = '🎉 100 FatalCoin добавлены на счет!';
        document.getElementById('claimRewardBtn').disabled = true;
        document.getElementById('claimRewardBtn').innerHTML = '<span class="btn-icon">✅</span>НАГРАДА ПОЛУЧЕНА';

        this.showNotification(`🎊 Поздравляем! Вы получили 100 FatalCoin! Новый баланс: ${user.balance}`, 'success');
    }

    // UI Updates
    updateProgress() {
        const completedSteps = this.users[this.currentUser]?.dailyProgress.completedSteps.length || 0;
        const progressPercent = (completedSteps / 3) * 100;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
    }

    updateUI() {
        if (!this.currentUser) return;

        const user = this.users[this.currentUser];
        
        document.getElementById('userWelcome').textContent = this.currentUser;
        document.getElementById('userBalance').textContent = user.balance;
        document.getElementById('keysClaimed').textContent = user.keysClaimed;
        
        this.updateLinksUpdateTime();
        this.showCooldownTimer();
    }

    updateLinksUpdateTime() {
        if (!this.currentUser) return;
        
        const user = this.users[this.currentUser];
        const lastUpdate = user.lastLinksUpdate;
        const updateElement = document.getElementById('linksUpdate');
        
        if (updateElement && lastUpdate) {
            const hours = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60));
            updateElement.textContent = hours < 24 ? `через ${24 - hours}ч` : 'Сегодня';
        }
    }

    showCooldownTimer() {
        const user = this.users[this.currentUser];
        if (!user || !user.lastClaim) return;

        const cooldownEnd = user.lastClaim + this.dailyCooldown;
        const timeLeft = cooldownEnd - Date.now();

        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            document.getElementById('cooldownTimer').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: var(--shadow);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Utility Functions
    isValidLink(link) {
        return link && typeof link === 'string' && link.startsWith('http');
    }

    // Auth Handlers
    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        const button = document.getElementById('loginBtn');
        button.classList.add('loading');

        // Simulate API call delay
        setTimeout(() => {
            const result = this.login(username, password);
            button.classList.remove('loading');
            
            if (result.success) {
                this.showMainApp();
                document.getElementById('loginUsername').value = '';
                document.getElementById('loginPassword').value = '';
                this.showNotification('Вход выполнен успешно!', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }, 1000);
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username || !password || !confirmPassword) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        const button = document.getElementById('registerBtn');
        button.classList.add('loading');

        setTimeout(() => {
            const result = this.register(username, password);
            button.classList.remove('loading');
            
            if (result.success) {
                this.showNotification('Регистрация успешна! Теперь войдите в систему.', 'success');
                this.showLogin();
                this.clearRegisterForm();
            } else {
                this.showNotification(result.message, 'error');
            }
        }, 1000);
    }

    handleLogout() {
        if (confirm('Выйти из системы?')) {
            this.logout();
            this.showNotification('Вы вышли из системы', 'info');
        }
    }

    showRegister() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    showLogin() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    }

    clearRegisterForm() {
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    // Data Management
    loadUsers() {
        const saved = localStorage.getItem('fatalbattles_users');
        this.users = saved ? JSON.parse(saved) : {};
    }

    saveUsers() {
        localStorage.setItem('fatalbattles_users', JSON.stringify(this.users));
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('fatalbattles_user', this.currentUser);
        }
    }

    clearCurrentUser() {
        localStorage.removeItem('fatalbattles_user');
    }

    saveUserProgress() {
        if (this.currentUser && this.users[this.currentUser]) {
            this.users[this.currentUser].dailyProgress.currentStep = this.currentStep;
            this.saveUsers();
        }
    }

    // App State
    checkAuth() {
        if (this.loadUserProgress()) {
            this.showMainApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('authOverlay').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateUI();
        
        // Update API status
        setTimeout(() => {
            document.getElementById('apiStatus').classList.add('online');
            document.querySelector('#apiStatus .status-indicator').style.background = '#17c964';
        }, 2000);
    }
}

// Initialize System
const fatalBattles = new FatalBattlesSystem();

// Global Functions for HTML
window.login = () => fatalBattles.handleLogin();
window.register = () => fatalBattles.handleRegister();
window.showRegister = () => fatalBattles.showRegister();
window.showLogin = () => fatalBattles.showLogin();
window.logout = () => fatalBattles.handleLogout();
window.completeStep = (step) => fatalBattles.completeStep(step);
window.claimDailyReward = () => fatalBattles.claimDailyReward();

// Timers
setInterval(() => {
    if (fatalBattles.currentUser) {
        fatalBattles.showCooldownTimer();
        fatalBattles.updateLinksUpdateTime();
    }
}, 1000);

// Save on exit
window.addEventListener('beforeunload', () => {
    if (fatalBattles.currentUser) {
        fatalBattles.saveUserProgress();
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification.success {
        border-left: 4px solid #17c964;
    }
    
    .notification.error {
        border-left: 4px solid #ff1a1a;
    }
    
    .notification.warning {
        border-left: 4px solid #f5a623;
    }
    
    .notification.info {
        border-left: 4px solid #0070f3;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(style);

console.log('▲ Vercel-optimized FatalBattles system ready!');