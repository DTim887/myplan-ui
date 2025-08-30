class ChatApp {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.voiceButton = document.getElementById('voiceButton');
        // 助手相关元素
        this.assistantName = document.getElementById('assistantName');
        this.assistantAvatar = document.getElementById('assistantAvatar');
        this.assistantDescription = document.getElementById('assistantDescription');
        this.switchAssistantBtn = document.getElementById('switchAssistantBtn');

        // 当前助手信息
        this.currentAssistant = null;

        // 语音相关属性
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        this.initEventListeners();
        // 页面初始化时自动发送欢迎消息
        //this.sendWelcomeMessageOnLoad();
        // 获取当前助手信息
        this.getCurrentAssistant();
    }

    displayWelcomeMessage() {
        const welcomeMessage = "你好！欢迎使用智能助手。请输入您的问题，我将尽力为您解答。";
        this.displayMessage(welcomeMessage, 'system');
    }

    // 页面加载时发送欢迎消息
    sendWelcomeMessageOnLoad() {
        // 确保 DOM 已完全加载
        setTimeout(() => {
            this.sendSilentMessage("你好！");
        }, 100);
    }

    // 静默发送消息，不显示在聊天窗口中
    sendSilentMessage(message) {
        // 清空输入框
        this.messageInput.value = '';

        // 禁用发送按钮和输入框
        this.sendButton.disabled = true;
        this.messageInput.disabled = true;

        // 显示正在输入指示器
        this.showTypingIndicator();

        // 调用后端API
        this.callAPI(message);
    }

    initEventListeners() {
        // 发送按钮点击事件
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // 回车键发送消息（不包括Shift+Enter换行）
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 语音按钮点击事件
        this.voiceButton.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });

        // 切换助手按钮点击事件
        if (this.switchAssistantBtn) {
            this.switchAssistantBtn.addEventListener('click', () => {
                this.switchAssistant();
            });
        }
    }

    // 获取当前助手信息
    async getCurrentAssistant() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/assistant/current`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.updateAssistantInfo(result.data);
        } catch (error) {
            console.error('获取当前助手信息失败:', error);
            // 使用默认值
            this.updateAssistantInfo({
                assistantName: '智能助手',
                avatar: 'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=A'
            });
        }
    }

    // 更新助手信息显示
    updateAssistantInfo(assistantData) {
        console.log(this.assistantName);
        console.log(assistantData);

        // 存储当前助手信息
        this.currentAssistant = assistantData;
        if (this.assistantName) {
            this.assistantName.textContent = assistantData.assistantName || '智能助手';
        }

        if (this.assistantAvatar) {
            this.assistantAvatar.src = `${CONFIG.API_BASE_URL}${assistantData.avatar}` || 'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=A';
            this.assistantAvatar.alt = `${assistantData.assistantName || '智能助手'}头像`;
        }

        if (this.assistantDescription) {
            this.assistantDescription.textContent = assistantData.description || '您的智能AI助手';
        }
    }

    // 切换助手
    async switchAssistant() {
        try {
            // 显示助手列表模态框
            this.showAssistantListModal();
        } catch (error) {
            console.error('切换助手失败:', error);
            alert('切换助手失败，请稍后重试');
        }
    }

    // 显示助手列表模态框
    showAssistantListModal() {
        const modal = document.getElementById('assistantListModal');
        const closeBtn = modal.querySelector('.close');
        const modalContent = modal.querySelector('.modal-content');

        // 显示模态框
        modal.style.display = 'block';

        // 获取助手列表
        this.getAssistantList();

        // 关闭按钮事件
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        // 点击模态框外部关闭
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // 获取助手列表
    async getAssistantList() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/assistant/all`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.renderAssistantList(result.data);
        } catch (error) {
            console.error('获取助手列表失败:', error);
            alert('获取助手列表失败，请稍后重试');
        }
    }

    // 渲染助手列表
    renderAssistantList(assistants) {
        const assistantListContainer = document.getElementById('assistantList');
        assistantListContainer.innerHTML = '';

        assistants.forEach(assistant => {
            const assistantItem = document.createElement('div');
            assistantItem.className = 'assistant-item';
            assistantItem.innerHTML = `
                <img class="assistant-item-avatar" src="${CONFIG.API_BASE_URL}${assistant.avatar}" alt="${assistant.assistantName}">
                <div class="assistant-item-info">
                    <div class="assistant-item-name">${assistant.assistantName}</div>
                    <div class="assistant-item-description">${assistant.description || ''}</div>
                </div>
            `;

            assistantItem.addEventListener('click', () => {
                this.selectAssistant(assistant);
            });

            assistantListContainer.appendChild(assistantItem);
        });
    }

    // 选择助手
    async selectAssistant(assistant) {
        try {
            // 关闭模态框
            document.getElementById('assistantListModal').style.display = 'none';

            // 调用API切换助手
            const response = await fetch(`${CONFIG.API_BASE_URL}/assistant/exchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assistantName: assistant.assistantName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 更新当前助手信息
            this.updateAssistantInfo(assistant);
        } catch (error) {
            console.error('切换助手失败:', error);
            alert('切换助手失败，请稍后重试');
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 显示用户消息
        this.displayMessage(message, 'user');

        // 清空输入框
        this.messageInput.value = '';

        // 禁用发送按钮和输入框
        this.sendButton.disabled = true;
        this.messageInput.disabled = true;

        // 显示正在输入指示器
        this.showTypingIndicator();

        // 调用后端API
        this.callAPI(message);
    }

    // 切换语音录制状态
    async toggleVoiceRecording() {
        if (!this.isRecording) {
            await this.startVoiceRecording();
        } else {
            this.stopVoiceRecording();
        }
    }

    // 开始语音录制
    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.voiceButton.classList.add('recording');
            this.voiceButton.textContent = '⏹️';
        } catch (error) {
            console.error('获取麦克风权限失败:', error);
            alert('无法访问麦克风，请检查权限设置');
        }
    }

    // 停止语音录制
    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.voiceButton.classList.remove('recording');
            this.voiceButton.textContent = '🎤';
        }
    }

    displayMessage(message, sender) {
        // 创建消息容器
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');
        messageContainer.classList.add(sender === 'user' ? 'user-message-container' : 'assistant-message-container');

        // 获取用户或助手头像
        let avatarSrc = '';
        if (sender === 'user' && typeof window.userManager !== 'undefined' && window.userManager.getCurrentUser()) {
            avatarSrc = window.userManager.getCurrentUser().avatar;
        } else if (sender === 'system' && this.currentAssistant && this.currentAssistant.avatar) {
            // 使用当前助手的头像
            avatarSrc = this.currentAssistant.avatar.startsWith('http') ?
                this.currentAssistant.avatar :
                `${CONFIG.API_BASE_URL}${this.currentAssistant.avatar}`;
        } else if (sender === 'system' && this.assistantAvatar) {
            avatarSrc = this.assistantAvatar.src;
        } else {
            // 默认头像
            avatarSrc = sender === 'user' ?
                'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=U' :
                'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=A';
        }

        // 创建头像元素
        const avatarElement = document.createElement('img');
        avatarElement.classList.add('message-avatar');
        avatarElement.src = avatarSrc;
        avatarElement.alt = sender === 'user' ? '用户头像' : '助手头像';

        // 创建消息气泡元素
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message');
        messageBubble.classList.add(sender === 'user' ? 'user-message' : 'system-message');

        // 检查是否为语音消息
        if (message instanceof Blob) {
            // 创建语音消息元素
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.src = URL.createObjectURL(message);
            messageBubble.appendChild(audioElement);
        } else {
            // 使用marked.js解析markdown
            if (typeof marked !== 'undefined') {
                messageBubble.innerHTML = marked.parse(message);
            } else {
                messageBubble.textContent = message;
            }
        }

        // 根据发送者类型安排头像和消息的顺序
        if (sender === 'user') {
            messageContainer.appendChild(avatarElement);
            messageContainer.appendChild(messageBubble);
        } else {
            messageContainer.appendChild(avatarElement);
            messageContainer.appendChild(messageBubble);
        }

        this.chatMessages.appendChild(messageContainer);

        // 滚动到底部
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.id = 'typingIndicator';
        typingElement.textContent = '正在输入...';

        this.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }

    // 发送语音消息
    async sendVoiceMessage(audioBlob) {
        // 显示语音消息
        this.displayMessage(audioBlob, 'user');

        // 这里可以添加将语音发送到后端的代码
        // 例如使用FormData发送音频文件
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-message.wav');
        console.log(formData);

        try {
            // 禁用发送按钮和输入框
            this.sendButton.disabled = true;
            this.messageInput.disabled = true;
            this.voiceButton.disabled = true;

            // 显示正在输入指示器
            this.showTypingIndicator();

            // 使用当前助手的chatApi字段，如果不存在则使用默认路径
            let voiceChatApiPath = '/voice-chat';
            if (this.currentAssistant && this.currentAssistant.chatApi) {
                // 假设语音聊天API路径是在chatApi基础上添加/voice后缀
                voiceChatApiPath = this.currentAssistant.chatApi;
            }

            // 构建完整的API URL
            let apiUrl;

            // 如果chatApi是相对路径
            apiUrl = `${CONFIG.API_BASE_URL}${voiceChatApiPath}`;


            // 使用流式响应处理语音回复
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('发送语音消息失败');
            }

            // 处理流式响应
            await this.handleStreamResponse(response);
        } catch (error) {
            console.error('发送语音消息失败:', error);
            // 隐藏正在输入指示器
            this.hideTypingIndicator();
            this.displayMessage('发送语音消息失败，请稍后重试', 'system');
        } finally {
            // 启用发送按钮和输入框
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.voiceButton.disabled = false;
            this.messageInput.focus();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // 处理流式响应
    async handleStreamResponse(response) {
        try {
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            // 创建消息容器
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'assistant-message-container');

            // 获取助手头像
            let avatarSrc = '';
            if (this.currentAssistant && this.currentAssistant.avatar) {
                // 使用当前助手的头像
                avatarSrc = this.currentAssistant.avatar.startsWith('http') ?
                    this.currentAssistant.avatar :
                    `${CONFIG.API_BASE_URL}${this.currentAssistant.avatar}`;
            } else if (this.assistantAvatar) {
                avatarSrc = this.assistantAvatar.src;
            } else {
                // 默认头像
                avatarSrc = 'https://via.placeholder.com/40x40/4e6ef2/ffffff?text=A';
            }

            // 创建头像元素
            const avatarElement = document.createElement('img');
            avatarElement.classList.add('message-avatar');
            avatarElement.src = avatarSrc;
            avatarElement.alt = '助手头像';

            // 创建系统消息元素
            const systemMessageElement = document.createElement('div');
            systemMessageElement.classList.add('message', 'system-message');

            // 将头像和消息元素添加到容器中
            messageContainer.appendChild(avatarElement);
            messageContainer.appendChild(systemMessageElement);
            this.chatMessages.appendChild(messageContainer);

            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // 解码接收到的数据
                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // 更新消息内容，支持markdown解析
                if (typeof marked !== 'undefined') {
                    // 为了更好的性能，我们只在有新内容时才重新解析
                    try {
                        systemMessageElement.innerHTML = marked.parse(accumulatedText);
                    } catch (e) {
                        // 如果markdown解析失败，使用纯文本显示
                        systemMessageElement.textContent = accumulatedText;
                    }
                } else {
                    systemMessageElement.textContent = accumulatedText;
                }

                // 滚动到底部
                this.scrollToBottom();
            }

            // 移除正在输入指示器
            this.hideTypingIndicator();

        } catch (error) {
            console.error('Error handling stream response:', error);

            // 移除正在输入指示器
            this.hideTypingIndicator();

            // 显示错误消息
            const errorElement = document.createElement('div');
            errorElement.classList.add('message', 'system-message');
            errorElement.textContent = '抱歉，处理回复时出现错误。请稍后再试。';
            this.chatMessages.appendChild(errorElement);
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async callAPI(message) {
        try {
            // 使用当前助手的chatApi字段，如果不存在则使用默认路径
            let chatApiPath = '/chat-stream';
            if (this.currentAssistant && this.currentAssistant.chatApi) {
                chatApiPath = this.currentAssistant.chatApi;
            }

            // 构建完整的API URL
            let apiUrl;
            if (chatApiPath.startsWith('http')) {
                // 如果chatApi是完整URL
                apiUrl = `${chatApiPath}?userMessage=${encodeURIComponent(message)}`;
            } else {
                // 如果chatApi是相对路径
                apiUrl = `${CONFIG.API_BASE_URL}${chatApiPath}?userMessage=${encodeURIComponent(message)}`;
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            // 创建系统消息元素
            // 1. 获取助手头像
            let avatarSrc = this.currentAssistant.avatar.startsWith('http') ?
                this.currentAssistant.avatar :
                `${CONFIG.API_BASE_URL}${this.currentAssistant.avatar}`;
            console.log(avatarSrc);
            const systemMessageElement = document.createElement('div');
            const avatarElement = document.createElement('img');
            avatarElement.src = avatarSrc;
            avatarElement.alt = '助手头像';
            avatarElement.classList.add('message-avatar');
            systemMessageElement.classList.add('message', 'system-message');



            // 创建消息容器
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'assistant-message-container');
            
            // 将头像和消息元素添加到容器中
            messageContainer.appendChild(avatarElement);
            messageContainer.appendChild(systemMessageElement);
            this.chatMessages.appendChild(messageContainer);

            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // 解码接收到的数据
                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                // 更新消息内容，支持markdown解析
                if (typeof marked !== 'undefined') {
                    // 为了更好的性能，我们只在有新内容时才重新解析
                    try {
                        systemMessageElement.innerHTML = marked.parse(accumulatedText);
                    } catch (e) {
                        // 如果markdown解析失败，使用纯文本显示
                        systemMessageElement.textContent = accumulatedText;
                    }
                } else {
                    systemMessageElement.textContent = accumulatedText;
                }

                // 滚动到底部
                this.scrollToBottom();
            }

            // 移除正在输入指示器
            this.hideTypingIndicator();

        } catch (error) {
            console.error('Error calling API:', error);

            // 移除正在输入指示器
            this.hideTypingIndicator();

            // 显示错误消息
            const errorElement = document.createElement('div');
            errorElement.classList.add('message', 'system-message');
            errorElement.textContent = '抱歉，发送消息时出现错误。请稍后再试。';
            this.chatMessages.appendChild(errorElement);

        } finally {
            // 启用发送按钮和输入框
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.messageInput.focus();
        }
    }
}

// 初始化聊天应用
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});