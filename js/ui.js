// ==================== UI 相关函数 ====================

// 显示认证页面
function showAuthForm() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

// 显示主应用
function showApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    if (currentUser) {
        document.getElementById('userEmail').textContent = currentUser.email;
    }
}

// 显示认证错误
function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

// 隐藏认证错误
function hideAuthError() {
    document.getElementById('authError').classList.add('hidden');
}

// 显示 Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// 更新预览
function updatePreview(parsed) {
    const preview = document.getElementById('preview');
    const grid = document.getElementById('previewGrid');
    const saveBtn = document.getElementById('saveBtn');

    if (!parsed) {
        preview.classList.remove('show');
        saveBtn.disabled = true;
        return;
    }

    preview.classList.add('show');
    saveBtn.disabled = false;

    grid.innerHTML = `
        <div class="preview-item">
            <div class="label">学习时长</div>
            <div class="value">${parsed.duration} 分</div>
        </div>
        <div class="preview-item">
            <div class="label">卡片总数</div>
            <div class="value">${parsed.cards} 张</div>
        </div>
        <div class="preview-item">
            <div class="label">平均速度</div>
            <div class="value">${parsed.avgSeconds} 秒/张</div>
        </div>
        <div class="preview-item">
            <div class="label">重来比例</div>
            <div class="value ${parsed.retryPercent > 30 ? 'warning' : ''}">${parsed.retryPercent}%</div>
        </div>
        <div class="preview-item">
            <div class="label">学习</div>
            <div class="value">${parsed.learn}</div>
        </div>
        <div class="preview-item">
            <div class="label">复习</div>
            <div class="value">${parsed.review}</div>
        </div>
        <div class="preview-item">
            <div class="label">重新学习</div>
            <div class="value">${parsed.relearn}</div>
        </div>
        <div class="preview-item">
            <div class="label">已筛选</div>
            <div class="value">${parsed.filtered}</div>
        </div>
    `;
}

// 更新统计概览
function updateStats() {
    const entries = Object.values(dataCache);

    const totalDays = entries.length;
    const totalCards = entries.reduce((sum, e) => sum + e.cards, 0);
    const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);
    const avgRetry = entries.length > 0
        ? (entries.reduce((sum, e) => sum + e.retryPercent, 0) / entries.length).toFixed(1)
        : 0;

    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('totalCards').textContent = totalCards;
    document.getElementById('totalTime').textContent = totalTime.toFixed(0);
    document.getElementById('avgRetry').textContent = avgRetry + '%';
}

// 更新历史记录
function updateHistory() {
    const list = document.getElementById('historyList');
    const dates = Object.keys(dataCache).sort().reverse();

    if (dates.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无数据，粘贴你的第一条 Anki 统计吧</div>';
        return;
    }

    list.innerHTML = dates.map(date => {
        const d = dataCache[date];
        return `
            <div class="history-item">
                <div class="history-date">${formatDate(date)}</div>
                <div class="history-stats">
                    <span>🃏 ${d.cards} 张</span>
                    <span>⏱️ ${d.duration} 分</span>
                    <span>🔄 ${d.retryPercent}%</span>
                </div>
                <div class="history-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteRecord('${date}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}
