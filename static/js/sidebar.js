import storage from './storage.js';
import { formatTime, truncateText } from './utils.js';

class SidebarManager {
  constructor() {
    this.historyList = document.getElementById('history-list');
    this.newChatBtn = document.getElementById('new-chat-btn');
    this.currentConversationId = null;
  }

  init() {
    this.newChatBtn.addEventListener('click', () => this.createNewChat());
    this.loadHistoryList();
  }

  async loadHistoryList() {
    try {
      const conversations = await storage.getConversations();
      this.renderHistoryList(conversations);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  renderHistoryList(conversations) {
    this.historyList.innerHTML = '';
    
    const sorted = conversations
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 50);

    sorted.forEach(conv => {
      const item = this.createHistoryItem(conv);
      this.historyList.appendChild(item);
    });
  }

  createHistoryItem(conv) {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (conv.id === this.currentConversationId) {
      item.classList.add('active');
    }
    item.dataset.id = conv.id;

    item.innerHTML = `
      <div class="history-item-content">
        <svg class="history-item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span class="history-item-text">${truncateText(conv.title || '新对话', 20)}</span>
        <span class="history-item-time">${formatTime(conv.updatedAt)}</span>
      </div>
      <div class="history-item-actions">
        <button class="delete-btn" aria-label="删除对话" data-id="${conv.id}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8M5 4V3h4v1M6 6v4M8 6v4M4 4l1 7h4l1-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn')) {
        this.loadConversation(conv.id);
      }
    });

    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteConversation(conv.id);
    });

    return item;
  }

  createNewChat() {
    this.currentConversationId = null;
    window.dispatchEvent(new CustomEvent('newChat'));
    this.updateActiveState();
  }

  async loadConversation(id) {
    try {
      const conv = await storage.getConversation(id);
      if (conv) {
        this.currentConversationId = id;
        window.dispatchEvent(new CustomEvent('loadConversation', { detail: conv }));
        this.updateActiveState();
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }

  async deleteConversation(id) {
    try {
      await storage.deleteConversation(id);
      if (this.currentConversationId === id) {
        this.currentConversationId = null;
        window.dispatchEvent(new CustomEvent('newChat'));
      }
      await this.loadHistoryList();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  updateActiveState() {
    const items = this.historyList.querySelectorAll('.history-item');
    items.forEach(item => {
      if (item.dataset.id === this.currentConversationId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  setCurrentConversationId(id) {
    this.currentConversationId = id;
    this.updateActiveState();
  }
}

export default new SidebarManager();
