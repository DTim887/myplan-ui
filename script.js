class ChatApp {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.voiceButton = document.getElementById('voiceButton');

        // 语音相关属性
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        this.initEventListeners();
        // 页面初始化时自动发送欢迎消息
        this.sendWelcomeMessageOnLoad();
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
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'system-message');

        // 检查是否为语音消息
        if (message instanceof Blob) {
            // 创建语音消息元素
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.src = URL.createObjectURL(message);
            messageElement.appendChild(audioElement);
        } else {
            // 使用marked.js解析markdown
            if (typeof marked !== 'undefined') {
                messageElement.innerHTML = marked.parse(message);
            } else {
                messageElement.textContent = message;
            }
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

            // 使用流式响应处理语音回复
            const response = await fetch(`${CONFIG.API_BASE_URL}/voice-chat`, {
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
    window.chatApp = new ChatApp();
});