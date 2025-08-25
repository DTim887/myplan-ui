class ChatApp {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');

        this.initEventListeners();
        this.displayWelcomeMessage();
    }

    displayWelcomeMessage() {
        const welcomeMessage = "你好！欢迎使用智能助手。请输入您的问题，我将尽力为您解答。";
        this.displayMessage(welcomeMessage, 'system');
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

    displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'system-message');

        // 使用marked.js解析markdown
        if (typeof marked !== 'undefined') {
            messageElement.innerHTML = marked.parse(message);
        } else {
            messageElement.textContent = message;
        }

        this.chatMessages.appendChild(messageElement);

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

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async callAPI(message) {
        try {
            // 使用配置文件中的API基础URL
            const response = await fetch(`${CONFIG.API_BASE_URL}/chat-stream?userMessage=${encodeURIComponent(message)}`, {
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
            const systemMessageElement = document.createElement('div');
            systemMessageElement.classList.add('message', 'system-message');
            this.chatMessages.appendChild(systemMessageElement);

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
    new ChatApp();
});