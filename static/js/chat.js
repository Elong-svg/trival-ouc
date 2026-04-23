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
    if (this.isWaiting || !userText.trim()) return;
    
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
    
    this.addMessage('user', userText);
    
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
      
      const MAX_MESSAGES = 10;
      const recentMessages = this.messages.slice(-MAX_MESSAGES);
      
      const messagesPayload = [
        { role: 'system', content: enhancedSystemPrompt },
        ...recentMessages
      ];
      
      console.log(`[DEBUG] 发送消息数量: ${messagesPayload.length} (系统提示 + ${recentMessages.length} 条历史消息)`);
      console.log(`[DEBUG] 系统提示词长度: ${enhancedSystemPrompt.length} 字符`);
      console.log(`[DEBUG] 请求URL: ${this.API_URL}`);
      console.log(`[DEBUG] 请求体大小: ${JSON.stringify({messages: messagesPayload, age_group: ageGroup}).length} 字符`);
      
      const requestStartTime = Date.now();
      
      // 使用流式响应
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          age_group: ageGroup
        })
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
      let buffer = '';
      let searchIndicator = null;  // 搜索指示器元素
      
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
                // 流式响应完成，移除搜索指示器
                this.removeSearchIndicator(searchIndicator);
                searchIndicator = null;
                // 流式响应完成
                fullContent = data.full_content || fullContent;
                console.log(`[DEBUG] 流式响应完成，总长度: ${fullContent.length} 字符`);
              } else if (data.searching !== undefined) {
                // ===== 搜索状态变化 =====
                if (data.searching) {
                  // 开始搜索 - 显示搜索指示器
                  searchIndicator = this.showSearchIndicator(aiMessageEl, data.tool_name || 'web_search');
                  console.log(`[DEBUG] 联网搜索中... 工具: ${data.tool_name || 'web_search'}`);
                } else {
                  // 搜索结束 - 移除搜索指示器
                  this.removeSearchIndicator(searchIndicator);
                  searchIndicator = null;
                  console.log(`[DEBUG] 联网搜索完成`);
                }
              } else if (data.content) {
                // 收到内容，确保搜索指示器已移除
                if (searchIndicator) {
                  this.removeSearchIndicator(searchIndicator);
                  searchIndicator = null;
                }
                // 接收新内容
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
      
      // 确保搜索指示器被移除
      this.removeSearchIndicator(searchIndicator);
      
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
      }
      
      await this.saveCurrentConversation();
      await sidebar.loadHistoryList();
      
    } catch (error) {
      // 直接显示友好的错误消息，不加"请求失败"前缀
      this.addMessage('error', error.message);
      
      // 确保更新发送按钮状态
      if (window.app && window.app.updateSendButtonState) {
        window.app.updateSendButtonState();
      }
    } finally {
      this.isWaiting = false;
      
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

  addMessage(role, content) {
    this.messages.push({ role, content });
    
    const messageEl = this.createMessageElement(role, content);
    this.chatWindow.appendChild(messageEl);
    
    this.scrollToBottom();
    
    return messageEl;
  }

  createMessageElement(role, content) {
    const div = document.createElement('div');
    div.className = `chat-message message-${role}`;
    
    if (role === 'assistant') {
      div.innerHTML = `
        <div class="ai-header">
          <div class="ai-avatar">
            <img src="images/AI助手形象.png" alt="小探">
          </div>
          <div class="ai-name">小探</div>
        </div>
        <div class="message-content">${content ? renderMarkdown(content) : ''}</div>
        <div class="message-actions">
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
      div.innerHTML = `
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

  // ===== 联网搜索指示器 =====
  showSearchIndicator(aiMessageEl, toolName) {
    // 移除已有的搜索指示器
    const existing = aiMessageEl.querySelector('.search-indicator');
    if (existing) existing.remove();
    
    // 创建搜索指示器
    const indicator = document.createElement('div');
    indicator.className = 'search-indicator';
    indicator.innerHTML = `
      <div class="search-indicator-inner">
        <div class="search-spinner"></div>
        <span class="search-text">正在联网搜索最新信息...</span>
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
  
  removeSearchIndicator(indicator) {
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
      const messageEl = this.createMessageElement(msg.role, msg.content);
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
}

export default new ChatManager();
