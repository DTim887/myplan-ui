// 用户信息管理类
class UserManager {
    constructor() {
        this.currentUser = null;
        this.userList = [];
        this.selectedUserForSwitch = null;
        this.chatMessages = document.getElementById('chatMessages');
        this.chatApp = null;
        this.init();
        this.initEventListeners();
    }

    async init() {
        await this.fetchCurrentUser();
        this.updateUserInfo();
    }

    initEventListeners() {
        // 切换用户按钮事件
        const switchUserBtn = document.getElementById('switchUserBtn');
        if (switchUserBtn) {
            switchUserBtn.addEventListener('click', () => {
                this.showSwitchUserModal();
            });
        }

        // 模态框关闭按钮事件
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // 点击模态框外部关闭
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // 确认切换按钮事件
        const confirmSwitchBtn = document.getElementById('confirmSwitchBtn');
        if (confirmSwitchBtn) {
            confirmSwitchBtn.addEventListener('click', () => {
                this.switchUser();
            });
        }

        // 取消切换按钮事件
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        if (confirmCancelBtn) {
            confirmCancelBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        }
    }

    // 从后端获取当前用户信息
    async fetchCurrentUser() {
        try {
            // 实际的API调用
            const response = await fetch(`${CONFIG.API_BASE_URL}/user/current`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 解析JSON响应
            const result = await response.json();

            // 从data字段获取用户信息
            const userData = result.data || {};

            // 确保用户信息包含所有必需的字段
            this.currentUser = {
                id: userData.id || 0,
                name: userData.nickname || userData.name || "访客用户",
                avatar: userData.avatar ? `${CONFIG.API_BASE_URL}${userData.avatar}` : "https://via.placeholder.com/60x60/4e6ef2/ffffff?text=U",
                sex: userData.sex || "",
                tags: Array.isArray(userData.tags) ? userData.tags : ["新用户"]
            };
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 使用默认用户信息
            this.currentUser = {
                id: 0,
                name: "访客用户",
                avatar: "https://via.placeholder.com/60x60/4e6ef2/ffffff?text=U",
                sex: "",
                tags: ["新用户"]
            };
        }
    }

    // 显示切换用户模态框
    async showSwitchUserModal() {
        try {
            // 获取用户列表
            await this.fetchUserList();

            // 显示用户列表
            this.renderUserList();

            // 显示模态框
            const modal = document.getElementById('switchUserModal');
            if (modal) {
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('获取用户列表失败:', error);
            alert('获取用户列表失败，请稍后再试');
        }
    }

    // 获取用户列表
    async fetchUserList() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/user/all`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.userList = result.data || [];
        } catch (error) {
            console.error('获取用户列表失败:', error);
            throw error;
        }
    }

    // 渲染用户列表
    renderUserList() {
        const userListContainer = document.getElementById('userList');
        if (!userListContainer) return;

        userListContainer.innerHTML = '';

        if (this.userList.length === 0) {
            userListContainer.innerHTML = '<p>暂无其他用户可切换</p>';
            return;
        }

        this.userList.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <img src="${user.avatar ? `${CONFIG.API_BASE_URL}${user.avatar}` : 'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=U'}" 
                     alt="${user.nickname || user.name}" class="user-item-avatar">
                <div class="user-item-info">
                    <div class="user-item-name">${user.nickname || user.name}</div>
                    <div class="user-item-nickname">${user.nickname}</div>
                </div>
            `;

            userItem.addEventListener('click', () => {
                this.showConfirmModal(user);
            });

            userListContainer.appendChild(userItem);
        });
    }

    // 显示确认模态框
    showConfirmModal(user) {
        this.selectedUserForSwitch = user;

        // 关闭切换用户模态框
        const switchUserModal = document.getElementById('switchUserModal');
        if (switchUserModal) {
            switchUserModal.style.display = 'none';
        }

        // 设置确认信息
        const confirmUserName = document.getElementById('confirmUserName');
        if (confirmUserName) {
            confirmUserName.textContent = user.nickname || user.name;
        }

        // 显示确认模态框
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            confirmModal.style.display = 'block';
        }
    }

    // 切换用户
    async switchUser() {
        if (!this.selectedUserForSwitch) return;

        try {
            // 调用服务器API进行用户切换
            const response = await fetch(`${CONFIG.API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickname: this.selectedUserForSwitch.nickname
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 关闭所有模态框
            this.closeAllModals();

            // 更新当前用户信息
            await this.fetchCurrentUser();
            this.updateUserInfo();

            // 清空聊天记录
            this.clearChatHistory();

            // 自动发送"你好！"消息
            this.sendWelcomeMessage();

            // 显示切换成功提示
            alert(`已切换到用户: ${this.currentUser.name}`);
        } catch (error) {
            console.error('切换用户失败:', error);
            alert('切换用户失败，请稍后再试');
        }
    }

    // 关闭所有模态框
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // 设置 ChatApp 实例的引用
    setChatApp(chatApp) {
        this.chatApp = chatApp;
    }

    // 发送欢迎消息
    sendWelcomeMessage() {
        if (this.chatApp) {
            // 使用静默方式发送"你好！"消息
            this.chatApp.sendSilentMessage("你好！");
        }
    }

    // 清空聊天记录
    clearChatHistory() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
    }

    // 更新用户信息显示
    updateUserInfo() {
        if (!this.currentUser) return;

        // 更新用户头像
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.src = this.currentUser.avatar;
            userAvatar.alt = `${this.currentUser.name}的头像`;
        }

        // 更新用户名
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = this.currentUser.name;
        }

        // 更新用户性别
        const userSex = document.getElementById('userSex');
        if (userSex) {
            userSex.textContent = this.currentUser.sex ? `性别: ${this.currentUser.sex}` : '';
        }

        // 更新用户标签
        const userTags = document.getElementById('userTags');
        if (userTags) {
            userTags.innerHTML = '';
            this.currentUser.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                userTags.appendChild(tagElement);
            });
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return this.currentUser;
    }
}

// 初始化用户管理器
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});