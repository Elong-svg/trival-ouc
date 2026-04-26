import storage from './storage.js';
import { renderMarkdown } from './markdown.js';
import CONFIG from './config.js';
import sidebar from './sidebar.js';

class ChatManager {
  constructor() {
    this.API_URL = CONFIG.API_URL;
    this.currentConversationId = null;
    this.messages = [];
    this.isWaiting = false;
    this.chatWindow = document.getElementById('chat-window');
    this.welcomePage = document.getElementById('welcome-page');
    this.typewriterTimer = null;
    this.userInput = document.getElementById('user-input');
    this.cooldownTime = 5000; // 5秒冷却时间
    this.lastMessageTime = 0;
  }

  init() {
    window.addEventListener('newChat', () => this.handleNewChat());
    window.addEventListener('loadConversation', (e) => this.handleLoadConversation(e));
    
    this.chatWindow.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      if (copyBtn) {
        this.copyMessage(copyBtn);
        return;
      }
      
      const speakBtn = e.target.closest('.speak-btn');
      if (speakBtn) {
        this.speakMessage(speakBtn);
        return;
      }
      
      const likeBtn = e.target.closest('.like-btn');
      if (likeBtn) {
        this.likeMessage(likeBtn);
        return;
      }
      
      const dislikeBtn = e.target.closest('.dislike-btn');
      if (dislikeBtn) {
        this.dislikeMessage(dislikeBtn);
        return;
      }
      
      const shareBtn = e.target.closest('.share-btn');
      if (shareBtn) {
        this.shareMessage(shareBtn);
        return;
      }
      
      const regenerateBtn = e.target.closest('.regenerate-btn');
      if (regenerateBtn) {
        this.regenerateMessage(regenerateBtn);
        return;
      }
      
      // 思考内容折叠/展开
      const thinkingLabel = e.target.closest('.thinking-content-label');
      if (thinkingLabel) {
        const thinkingContent = thinkingLabel.closest('.thinking-content');
        if (thinkingContent) {
          thinkingContent.classList.toggle('collapsed');
        }
        return;
      }
    });
  }

  async copyMessage(btn) {
    const content = btn.dataset.content;
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      
      this.showToast('已复制到剪贴板');
      
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      this.showToast('复制失败，请手动复制');
    }
  }

  showToast(message) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  autoResizeTextarea() {
    if (!this.userInput) return;
    this.userInput.style.height = 'auto';
    this.userInput.style.height = Math.min(this.userInput.scrollHeight, 150) + 'px';
  }

  editMessage(btn) {
    console.log('编辑按钮被点击');
    const messageEl = btn.closest('.chat-message');
    const contentEl = messageEl.querySelector('.message-content');
    const originalContent = btn.dataset.content;
    
    console.log('originalContent:', originalContent);
    console.log('contentEl:', contentEl);
    
    if (!contentEl || !originalContent) {
      console.log('编辑失败：缺少内容');
      return;
    }
    
    const isUser = messageEl.classList.contains('message-user');
    console.log('isUser:', isUser);
    
    if (isUser) {
      this.userInput.value = originalContent;
      this.userInput.focus();
      this.autoResizeTextarea();
      this.showToast('已加载到输入框，修改后可重新发送');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = originalContent;
      textarea.className = 'edit-textarea';
      contentEl.innerHTML = '';
      contentEl.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const saveEdit = () => {
        const newContent = textarea.value.trim();
        if (newContent) {
          contentEl.innerHTML = renderMarkdown(newContent);
        } else {
          contentEl.innerHTML = renderMarkdown(originalContent);
        }
      };
      
      textarea.addEventListener('blur', saveEdit);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          textarea.blur();
        }
      });
    }
  }

  async shareMessage(btn) {
    const content = btn.dataset.content;
    if (!content) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '小探 - 中国海洋大学AI助手',
          text: content
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.copyMessage(btn);
        }
      }
    } else {
      this.copyMessage(btn);
    }
  }

  speakMessage(btn) {
    const content = btn.dataset.content;
    if (!content) return;
    
    if (btn.classList.contains('speaking')) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      btn.classList.remove('speaking');
      return;
    }
    
    btn.classList.add('speaking');
    
    let cleanText = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: 'zh-CN-XiaoxiaoNeural' })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('TTS请求失败');
      }
      return response.blob();
    })
    .then(blob => {
      const audio = new Audio(URL.createObjectURL(blob));
      this.currentAudio = audio;
      
      audio.onended = () => {
        btn.classList.remove('speaking');
        URL.revokeObjectURL(audio.src);
        this.currentAudio = null;
      };
      audio.onerror = () => {
        btn.classList.remove('speaking');
        this.showToast('语音播放失败');
        this.currentAudio = null;
      };
      audio.play();
      this.showToast('正在朗读...');
    })
    .catch(err => {
      btn.classList.remove('speaking');
      console.error('TTS错误:', err);
      this.showToast('语音合成失败');
    });
  }

  likeMessage(btn) {
    const messageEl = btn.closest('.chat-message');
    const likeBtn = messageEl.querySelector('.like-btn');
    const dislikeBtn = messageEl.querySelector('.dislike-btn');
    
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
      if (dislikeBtn) dislikeBtn.classList.remove('active');
      this.showToast('感谢反馈！');
    }
  }

  async regenerateMessage(btn) {
    const messageEl = btn.closest('.chat-message');
    const messageIndex = Array.from(this.chatWindow.children).indexOf(messageEl);
    
    // 找到对应的用户消息
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (this.chatWindow.children[i].classList.contains('message-user')) {
        userMessageIndex = i;
        break;
      }
    }
    
    if (userMessageIndex === -1) {
      this.showToast('找不到对应的用户消息');
      return;
    }
    
    // 获取用户消息内容
    const userMessageEl = this.chatWindow.children[userMessageIndex];
    const userContent = userMessageEl.querySelector('.message-content')?.textContent || '';
    
    // 删除当前的 AI 消息
    messageEl.remove();
    this.messages.splice(messageIndex, 1);
    
    // 重新发送消息（跳过冷却时间检查）
    this.isWaiting = false;
    this.lastMessageTime = 0; // 重置冷却时间
    await this.sendMessage(userContent);
  }

  dislikeMessage(btn) {
    const messageEl = btn.closest('.chat-message');
    const likeBtn = messageEl.querySelector('.like-btn');
    const dislikeBtn = messageEl.querySelector('.dislike-btn');
    
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
      if (likeBtn) likeBtn.classList.remove('active');
      this.showToast('感谢反馈，我们会改进！');
    }
  }

  async sendMessage(userText) {
    // 获取上传的图片和文件
    const app = window.app;
    const uploadedImages = app ? app.uploadedImages || [] : [];
    const uploadedFiles = app ? app.uploadedFiles || [] : [];
    
    // 检查是否有内容（文本、图片或文件）
    const hasContent = userText.trim() || uploadedImages.length > 0 || uploadedFiles.length > 0;
    if (this.isWaiting || !hasContent) return;
    
    // 如果只有文件没有文本，自动生成提示
    let messageText = userText.trim();
    if (!messageText && uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(f => f.filename).join('、');
      messageText = `请帮我解读这个文件：${fileNames}`;
    }
    
    // 检查冷却时间
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    if (timeSinceLastMessage < this.cooldownTime && this.lastMessageTime > 0) {
      const remainingTime = Math.ceil((this.cooldownTime - timeSinceLastMessage) / 1000);
      this.showToast(`小探正在思考中，请${remainingTime}秒后再试～ ⏰`);
      return;
    }

    this.isWaiting = true;
    this.lastMessageTime = now;
    this.hideWelcomePage();
    
    // 立即更新发送按钮状态为停止按钮
    if (window.app && window.app.updateSendButtonState) {
      window.app.updateSendButtonState();
    }
    
    // 添加用户消息（包含图片和文件）
    this.addMessage('user', messageText, uploadedImages, uploadedFiles);
    
    if (!this.currentConversationId) {
      this.currentConversationId = Date.now().toString();
      sidebar.setCurrentConversationId(this.currentConversationId);
    }
    
    await this.saveCurrentConversation();
    await sidebar.loadHistoryList();
    
    try {
      const knowledgeContext = this.getKnowledgeContext(userText);
      
      const systemPrompt = CONFIG.SYSTEM_PROMPT;
      const ageGroup = this.getCurrentAgeGroup();
      const ageConfig = CONFIG.AGE_GROUP_CONFIG[ageGroup];
      const agePrompt = ageConfig ? ageConfig.prompt : '';
      const curriculumLink = ageConfig && ageConfig.curriculum_link ? ageConfig.curriculum_link : '';
      
      // 构建系统提示词
      let enhancedSystemPrompt = systemPrompt + '\n\n' + agePrompt;
      
      // 添加教材结合要求
      if (curriculumLink) {
        enhancedSystemPrompt += '\n\n## 教材结合要求\n' + curriculumLink + '\n\n请在回答中适当联系学生当前所学的教材内容，帮助他们建立课堂知识与研学内容的联系。';
      }
      
      // 高中生选科信息（仅在选了3科时添加）
      if (ageGroup === 'high_school' && ageConfig.subjects) {
        const app = window.app;
        const selectedSubjects = app ? app.getSelectedSubjects() : [];
        
        if (selectedSubjects.length === 3) {
          enhancedSystemPrompt += '\n\n## 用户选科信息\n用户选择了以下3个科目：' + selectedSubjects.join('、') + '\n\n';
          
          selectedSubjects.forEach(subject => {
            if (ageConfig.subject_prompts && ageConfig.subject_prompts[subject]) {
              enhancedSystemPrompt += ageConfig.subject_prompts[subject] + '\n\n';
            }
          });
          
          enhancedSystemPrompt += '请根据用户选择的科目，在回答中重点联系相关学科知识，提供针对性的内容推荐和升学建议。';
        } else if (selectedSubjects.length > 0) {
          enhancedSystemPrompt += '\n\n## 用户选科信息\n用户正在考虑以下科目：' + selectedSubjects.join('、') + '（尚未最终确定）\n\n';
          enhancedSystemPrompt += '用户可能还在犹豫选科，请在回答中适当提及这些科目相关的知识，但不要过度强调。';
        }
      }
      
      // 添加知识库上下文
      if (knowledgeContext) {
        enhancedSystemPrompt += `\n\n## 相关知识库参考\n${knowledgeContext}\n\n请基于以上知识库内容，结合你的通用知识，给用户一个详细、生动、符合年龄段的回答。`;
      }
      
      // 如果有图片，添加视觉理解提示
      if (uploadedImages.length > 0) {
        enhancedSystemPrompt += '\n\n## 视觉理解能力\n用户发送了图片，请仔细观察图片内容并进行详细解读。如果图片与海洋、校园、学习相关，请结合海大特色进行讲解。';
      }
      
      // 如果有文件，添加文件解读提示
      if (uploadedFiles.length > 0) {
        enhancedSystemPrompt += '\n\n## 文件解读能力\n用户上传了文件，请仔细阅读文件内容并进行专业解读。提取文件的核心要点，用通俗易懂的语言进行总结和分析。';
      }
      
      const MAX_MESSAGES = 10;
      const recentMessages = this.messages.slice(-MAX_MESSAGES);
      
      // 构建最后一条用户消息（包含图片和文件）
      let lastUserMessage;
      const contentParts = [];
      
      // 添加图片
      if (uploadedImages.length > 0) {
        uploadedImages.forEach(img => {
          contentParts.push({
            type: 'image_url',
            image_url: { url: img.base64 }
          });
        });
      }
      
      // 添加文件内容
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
          contentParts.push({
            type: 'text',
            text: `\n\n--- ${file.filename} (${file.fileType.toUpperCase()}文件内容) ---\n${file.content}\n--- 文件内容结束 ---\n\n`
          });
        });
      }
      
      // 添加用户文本
      if (userText) {
        contentParts.push({
          type: 'text',
          text: userText
        });
      }
      
      // 构造消息
      if (contentParts.length === 1 && contentParts[0].type === 'text') {
        // 如果只有文本，直接使用字符串
        lastUserMessage = { role: 'user', content: contentParts[0].text };
      } else {
        // 多模态消息
        lastUserMessage = { role: 'user', content: contentParts };
      }
      
      const messagesPayload = [
        { role: 'system', content: enhancedSystemPrompt },
        ...recentMessages.slice(0, -1), // 除了最后一条
        lastUserMessage // 添加包含图片的最后一条消息
      ];
      
      console.log(`[DEBUG] 发送消息数量: ${messagesPayload.length} (系统提示 + ${recentMessages.length} 条历史消息)`);
      console.log(`[DEBUG] 系统提示词长度: ${enhancedSystemPrompt.length} 字符`);
      console.log(`[DEBUG] 图片数量: ${uploadedImages.length}`);
      console.log(`[DEBUG] 请求URL: ${this.API_URL}`);
      console.log(`[DEBUG] 请求体大小: ${JSON.stringify({messages: messagesPayload, age_group: ageGroup}).length} 字符`);
      
      const requestStartTime = Date.now();
      
      // 创建 AbortController 用于打断
      this.abortController = new AbortController();
      
      // 处理流式响应
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          age_group: ageGroup,
          enable_thinking: window.app.thinkingEnabled !== false // 传递思考开关状态，默认开启
        }),
        signal: this.abortController.signal
      });
      
      const responseTime = Date.now() - requestStartTime;
      console.log(`[DEBUG] 首字响应时间: ${responseTime}ms`);
      console.log(`[DEBUG] HTTP状态码: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] 请求失败 - 状态码: ${response.status}`);
        console.error(`[ERROR] 错误响应:`, errorText);
        
        let friendlyMessage = '';
        if (response.status === 504 || response.status === 500) {
          friendlyMessage = '小探正在思考中，可能有点忙～ 请稍等一下再问我哦！😊';
        } else if (response.status === 429) {
          friendlyMessage = '你的问题太多啦，小探需要休息一下～ 稍后再来问我吧！💪';
        } else if (response.status === 401) {
          friendlyMessage = '哎呀，小探的通行证好像过期了，请联系管理员更新哦！🔑';
        } else {
          friendlyMessage = '小探遇到了一点小问题，请稍后再试～ 🌟';
        }
        
        throw new Error(friendlyMessage);
      }
      
      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullReasoning = '';
      let buffer = '';
      let thinkingIndicator = null;  // 思考指示器元素
      let thinkingContentEl = null;  // 思考内容显示区域
      let isThinking = false;
      
      // 创建 AI 消息元素（空内容）
      const aiMessageEl = this.addMessage('assistant', '');
      const contentEl = aiMessageEl.querySelector('.message-content');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              
              if (data.done) {
                // 流式响应完成
                fullContent = data.full_content || fullContent;
                fullReasoning = data.full_reasoning || fullReasoning;
                console.log(`[DEBUG] 流式响应完成，回答长度: ${fullContent.length} 字符, 思考长度: ${fullReasoning.length} 字符`);
              } else if (data.thinking_start) {
                // ===== 思考阶段开始 =====
                isThinking = true;
                thinkingIndicator = this.showThinkingIndicator(aiMessageEl);
                // 创建思考内容显示区域
                thinkingContentEl = document.createElement('div');
                thinkingContentEl.className = 'thinking-content';
                thinkingContentEl.innerHTML = '<div class="thinking-content-label">💭 思考过程</div><div class="thinking-content-text"></div>';
                if (thinkingIndicator) {
                  aiMessageEl.insertBefore(thinkingContentEl, thinkingIndicator.nextSibling);
                } else {
                  aiMessageEl.insertBefore(thinkingContentEl, contentEl);
                }
                console.log(`[DEBUG] 深度思考中...`);
              } else if (data.thinking_end) {
                // ===== 思考阶段结束 =====
                isThinking = false;
                this.removeThinkingIndicator(thinkingIndicator);
                thinkingIndicator = null;
                // 折叠思考内容
                if (thinkingContentEl) {
                  thinkingContentEl.classList.add('collapsed');
                  thinkingContentEl = null;
                }
                console.log(`[DEBUG] 深度思考完成`);
              } else if (data.reasoning) {
                // ===== 思考过程内容（流式） =====
                fullReasoning += data.reasoning;
                // 实时更新思考内容显示（使用 Markdown 渲染）
                if (thinkingContentEl) {
                  const thinkingTextEl = thinkingContentEl.querySelector('.thinking-content-text');
                  if (thinkingTextEl) {
                    thinkingTextEl.innerHTML = renderMarkdown(fullReasoning);
                  }
                }
                console.log(`[DEBUG] 思考内容: ${data.reasoning.substring(0, 50)}...`);
              } else if (data.content) {
                // ===== 回答内容 =====
                fullContent += data.content;
                // 实时更新显示
                contentEl.innerHTML = renderMarkdown(fullContent);
                // 滚动到底部
                this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      // 确保思考指示器被移除
      this.removeThinkingIndicator(thinkingIndicator);
      
      // 最终渲染
      contentEl.innerHTML = renderMarkdown(fullContent);
      this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
      
      // 更新消息操作按钮的内容
      const copyBtn = aiMessageEl.querySelector('.copy-btn');
      const speakBtn = aiMessageEl.querySelector('.speak-btn');
      if (copyBtn) copyBtn.dataset.content = this.escapeHtml(fullContent);
      if (speakBtn) speakBtn.dataset.content = this.escapeHtml(fullContent);
      
      // 更新消息数组中的内容
      if (this.messages.length > 0) {
        this.messages[this.messages.length - 1].content = fullContent;
        this.messages[this.messages.length - 1].reasoning = fullReasoning;
      }
      
      await this.saveCurrentConversation();
      await sidebar.loadHistoryList();
      
    } catch (error) {
      // 如果是用户主动中断，不显示错误
      if (error.name === 'AbortError') {
        console.log('[DEBUG] 用户中断生成');
        
        // 如果已有内容，保留；否则删除消息
        if (!fullContent.trim()) {
          aiMessageEl.remove();
          this.messages.pop();
        }
      } else {
        // 直接显示友好的错误消息，不加"请求失败"前缀
        this.addMessage('error', error.message);
      }
      
      // 确保更新发送按钮状态
      if (window.app && window.app.updateSendButtonState) {
        window.app.updateSendButtonState();
      }
    } finally {
      this.isWaiting = false;
      this.abortController = null;
      
      // 再次确保更新发送按钮状态
      if (window.app && window.app.updateSendButtonState) {
        window.app.updateSendButtonState();
      }
    }
  }

  getKnowledgeContext(userText) {
    const text = userText.toLowerCase();
    const kb = CONFIG.OUC_KNOWLEDGE_BASE;
    
    // 智能关键词匹配 - 使用权重系统
    const keywordMap = {
      '校区分布': {
        keywords: ['景点', '游览', '参观', '校区', '鱼山', '崂山', '浮山', '西海岸', '建筑', '路线', '规划', '导航', '地图'],
        weight: 3,
        maxLength: 120
      },
      '历史沿革': {
        keywords: ['校史', '历史', '建校', '校训', '创办', '沿革', '发展', '变迁'],
        weight: 3,
        maxLength: 120
      },
      '学科特色': {
        keywords: ['学科', '专业', '学院', '双一流', '优势', '特色', '选科', '升学'],
        weight: 3,
        maxLength: 120
      },
      '科研实力': {
        keywords: ['科研', '实验室', '研究', '创新', '技术', '成果', '论文'],
        weight: 3,
        maxLength: 120
      },
      '周边景点': {
        keywords: ['周边', '小鱼山', '八大关', '栈桥', '旅游', '游玩', '附近', '景点'],
        weight: 2,
        maxLength: 100
      },
      '实用信息': {
        keywords: ['交通', '怎么', '地址', '电话', '官网', '气候', '季节', '参观'],
        weight: 2,
        maxLength: 80
      },
      '研学资源': {
        keywords: ['研学', '资源', '博物馆', '标本', '观测', '实践'],
        weight: 2,
        maxLength: 100
      },
      '校园文化': {
        keywords: ['美食', '吃', '食堂', '文化', '活动', '社团', '生活'],
        weight: 2,
        maxLength: 80
      },
      '学校概况': {
        keywords: ['简介', '概况', '介绍', '海大', '海洋大学', 'ouc', '基本', '什么'],
        weight: 1,
        maxLength: 100
      }
    };
    
    // 计算每个section的匹配分数
    const scores = {};
    for (const [section, config] of Object.entries(keywordMap)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          score += config.weight;
        }
      }
      if (score > 0) {
        scores[section] = { score, maxLength: config.maxLength };
      }
    }
    
    // 按分数排序，取前2个
    const sortedSections = Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 2);
    
    if (sortedSections.length === 0) {
      // 如果没有匹配，但提到了海大，返回概况
      if (text.includes('海大') || text.includes('海洋大学') || text.includes('ouc')) {
        return this.extractSection(kb, '学校概况', 80);
      }
      return null;
    }
    
    // 提取匹配的section
    const relevantSections = sortedSections.map(([section, config]) => 
      this.extractSection(kb, section, config.maxLength)
    ).filter(s => s);
    
    if (relevantSections.length > 0) {
      const result = relevantSections.join('\n\n');
      return result.length > 250 ? result.substring(0, 250) + '...' : result;
    }
    
    return null;
  }
  
  extractSection(knowledgeBase, sectionName, maxLength = 150) {
    const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=## |$)`, 'i');
    const match = knowledgeBase.match(regex);
    if (!match) return null;
    
    let content = match[0].trim();
    
    const lines = content.split('\n');
    let result = lines[0];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      if (line.startsWith('-') || line.startsWith('*')) {
        result += '\n' + line;
      } else {
        result += ' ' + line;
      }
      
      if (result.length >= maxLength) break;
    }
    
    return result.length > maxLength ? result.substring(0, maxLength) + '...' : result;
  }

  async typeWriterEffect(text) {
    const messageEl = this.createMessageElement('assistant', '');
    this.chatWindow.appendChild(messageEl);
    
    const contentEl = messageEl.querySelector('.message-content');
    const speed = CONFIG.UI.TYPEWRITER_SPEED;
    const batchSize = CONFIG.UI.TYPEWRITER_BATCH;
    
    let currentIndex = 0;
    let displayedText = '';
    
    return new Promise((resolve) => {
      const type = () => {
        if (currentIndex < text.length) {
          const end = Math.min(currentIndex + batchSize, text.length);
          displayedText += text.substring(currentIndex, end);
          currentIndex = end;
          
          contentEl.innerHTML = renderMarkdown(displayedText);
          this.scrollToBottom();
          
          this.typewriterTimer = setTimeout(type, speed);
        } else {
          contentEl.innerHTML = renderMarkdown(text);
          this.messages.push({ role: 'assistant', content: text });
          
          const copyBtn = messageEl.querySelector('.copy-btn');
          const speakBtn = messageEl.querySelector('.speak-btn');
          const shareBtn = messageEl.querySelector('.share-btn');
          if (copyBtn) copyBtn.dataset.content = text;
          if (speakBtn) speakBtn.dataset.content = text;
          if (shareBtn) shareBtn.dataset.content = text;
          
          this.scrollToBottom();
          resolve();
        }
      };
      
      type();
    });
  }

  addMessage(role, content, images = [], files = []) {
    this.messages.push({ role, content, images, files });
    
    const messageEl = this.createMessageElement(role, content, images, files);
    this.chatWindow.appendChild(messageEl);
    
    this.scrollToBottom();
    
    return messageEl;
  }

  createMessageElement(role, content, images = [], files = []) {
    const div = document.createElement('div');
    div.className = `chat-message message-${role}`;
    
    if (role === 'assistant') {
      // 构建AI消息内容（包含图片和文件）
      let attachmentsHtml = '';
      
      // 添加图片
      if (images && images.length > 0) {
        attachmentsHtml += images.map(img => 
          `<img class="message-image" src="${img.base64}" alt="${this.escapeHtml(img.name)}">`
        ).join('');
      }
      
      // 添加文件
      if (files && files.length > 0) {
        attachmentsHtml += files.map(file => `
          <div class="message-file">
            <div class="message-file-icon">${this.getFileIconSVG(file.fileType)}</div>
            <div class="message-file-info">
              <div class="message-file-name">${file.filename}</div>
              <div class="message-file-meta">${file.fileType.toUpperCase()} · ${this.formatFileSize(file.file.size)}</div>
            </div>
          </div>
        `).join('');
      }
      
      div.innerHTML = `
        <div class="ai-header">
          <div class="ai-avatar">
            <img src="images/AI助手形象.png" alt="小探">
          </div>
          <div class="ai-name">小探</div>
        </div>
        ${attachmentsHtml}
        <div class="message-content">${content ? renderMarkdown(content) : ''}</div>
        <div class="message-actions">
          <button class="action-btn regenerate-btn" title="重新生成">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M2 8a6 6 0 0110.47-4M14 8a6 6 0 01-10.47 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M12 2v4h-4M4 14v-4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="action-btn copy-btn" title="复制" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="action-btn speak-btn" title="语音朗读" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M3 6v4h3l4 4V2L6 6H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 5.5a2.5 2.5 0 010 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M12.5 4a4.5 4.5 0 010 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="action-btn like-btn" title="点赞">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M4 6v7h2V6H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6l1-4h1a1 1 0 011 1v3h4a1 1 0 011 1l-1 5a1 1 0 01-1 1H6V6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="action-btn dislike-btn" title="踩">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M4 10V3h2v7H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 10l1 4h1a1 1 0 001-1v-3h4a1 1 0 001-1l-1-5a1 1 0 00-1-1H6v4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="action-btn share-btn" title="转发" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M12 8l-4-4v3H3v2h5v3l4-4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
    } else if (role === 'user') {
      // 构建用户消息内容（包含图片和文件）
      let attachmentsHtml = '';
      
      // 添加图片
      if (images && images.length > 0) {
        attachmentsHtml += images.map(img => 
          `<img class="message-image" src="${img.base64}" alt="${this.escapeHtml(img.name)}">`
        ).join('');
      }
      
      // 添加文件
      if (files && files.length > 0) {
        attachmentsHtml += files.map(file => `
          <div class="message-file">
            <div class="message-file-icon">${this.getFileIconSVG(file.fileType)}</div>
            <div class="message-file-info">
              <div class="message-file-name">${file.filename}</div>
              <div class="message-file-type">${file.fileType.toUpperCase()} 文件</div>
            </div>
          </div>
        `).join('');
      }
      
      div.innerHTML = `
        ${attachmentsHtml}
        <div class="message-content">${this.escapeHtml(content)}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="action-btn share-btn" title="分享" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M12 8l-4-4v3H3v2h5v3l4-4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="action-btn edit-btn" title="编辑" data-content="${this.escapeHtml(content)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="pointer-events: none;">
              <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
      
      // 绑定图片点击放大事件
      div.querySelectorAll('.message-image').forEach(img => {
        img.addEventListener('click', () => {
          this.showImageModal(img.src);
        });
      });
    } else {
      div.innerHTML = `<div class="message-content">${content}</div>`;
    }
    
    return div;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== 深度思考指示器 =====
  showThinkingIndicator(aiMessageEl) {
    // 移除已有的思考指示器
    const existing = aiMessageEl.querySelector('.thinking-indicator');
    if (existing) existing.remove();
    
    // 创建思考指示器
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
    indicator.innerHTML = `
      <div class="thinking-indicator-inner">
        <div class="thinking-spinner"></div>
        <span class="thinking-text">小探正在深度思考中...</span>
      </div>
    `;
    
    // 插入到 AI 消息的内容区域之前
    const contentEl = aiMessageEl.querySelector('.message-content');
    if (contentEl) {
      aiMessageEl.insertBefore(indicator, contentEl);
    } else {
      aiMessageEl.appendChild(indicator);
    }
    
    // 滚动到底部
    this.scrollToBottom();
    
    return indicator;
  }
  
  removeThinkingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      // 添加淡出动画
      indicator.classList.add('fade-out');
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    });
  }

  hideWelcomePage() {
    this.welcomePage.style.display = 'none';
  }

  showWelcomePage() {
    this.welcomePage.style.display = 'flex';
    this.chatWindow.innerHTML = '';
  }

  handleNewChat() {
    this.currentConversationId = null;
    this.messages = [];
    this.showWelcomePage();
  }

  handleLoadConversation(event) {
    const conv = event.detail;
    this.currentConversationId = conv.id;
    this.messages = conv.messages || [];
    this.renderConversation(this.messages);
  }

  renderConversation(messages) {
    this.chatWindow.innerHTML = '';
    this.hideWelcomePage();
    
    messages.forEach(msg => {
      const messageEl = this.createMessageElement(msg.role, msg.content, msg.images || [], msg.files || []);
      this.chatWindow.appendChild(messageEl);
    });
    
    this.scrollToBottom();
  }

  async saveCurrentConversation() {
    if (!this.currentConversationId) return;
    
    await storage.saveConversation({
      id: this.currentConversationId,
      title: this.messages[0]?.content?.substring(0, 30) || '新对话',
      messages: this.messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  getCurrentAgeGroup() {
    const ageDisplay = document.getElementById('age-display');
    if (!ageDisplay) return 'high_school';
    
    const text = ageDisplay.textContent;
    const ageMap = {
      '小学低段': 'primary_1_3',
      '小学高段': 'primary_4_6',
      '初中阶段': 'middle_school',
      '高中阶段': 'high_school'
    };
    
    return ageMap[text] || 'high_school';
  }

  interruptGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.showToast('已停止生成');
    }
  }

  getFileIconSVG(fileType) {
    const icons = {
      pdf: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="44">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="#FF4B4B"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`,
      docx: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="44">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="#4B89FF"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`,
      txt: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="44">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="#8C8C8C"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`,
      md: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="44">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="#8C8C8C"/>
              <path d="M8 8h8M8 12h8M8 16h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`
    };
    return icons[fileType] || icons.txt;
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
  }

  showImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <div class="image-modal-backdrop"></div>
      <div class="image-modal-content">
        <img src="${src}" alt="预览图片">
        <button class="image-modal-close">×</button>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('.image-modal-backdrop').addEventListener('click', close);
    modal.querySelector('.image-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }
}

export default new ChatManager();
