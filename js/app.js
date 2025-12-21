// ==================== 应用入口和事件绑定 ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM ready');

    // ==================== 认证相关事件绑定 ====================

    // 登录/注册 Tab 切换
    document.getElementById('loginTab').addEventListener('click', () => {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('authSubmit').textContent = '登录';
        isSignUpMode = false;
        hideAuthError();
    });

    document.getElementById('signupTab').addEventListener('click', () => {
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('authSubmit').textContent = '注册';
        isSignUpMode = true;
        hideAuthError();
    });

    // 表单提交
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const submitBtn = document.getElementById('authSubmit');

        submitBtn.disabled = true;
        submitBtn.textContent = isSignUpMode ? '注册中...' : '登录中...';

        if (isSignUpMode) {
            await signUp(email, password);
        } else {
            await signIn(email, password);
        }

        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? '注册' : '登录';
    });

    // OAuth 登录
    document.getElementById('googleLogin').addEventListener('click', () => signInWithOAuth('google'));
    document.getElementById('githubLogin').addEventListener('click', () => signInWithOAuth('github'));

    // 登出按钮
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        console.log('Logout clicked');
        await signOut();
    });

    // ==================== 标记 DOM 已准备好 ====================
    isDomReady = true;
    console.log('isDomReady set to true');

    // ==================== 检查认证状态 ====================
    // 如果 onAuthStateChange 已经设置了 currentUser，直接初始化
    if (currentUser) {
        console.log('currentUser already set, calling initApp');
        await initApp();
    } else {
        // 否则检查 session
        console.log('Checking auth...');
        const isLoggedIn = await checkAuth();
        if (isLoggedIn) {
            console.log('User is logged in, calling initApp');
            await initApp();
        }
    }

    // ==================== 主应用事件绑定 ====================

    // 初始化日期选择器
    const dateSelect = document.getElementById('dateSelect');
    const saveBtn = document.getElementById('saveBtn');
    dateSelect.value = getTodayDate();

    // 更新按钮文案
    function updateSaveBtnText() {
        const selectedDate = dateSelect.value;
        if (selectedDate) {
            saveBtn.textContent = `保存到 ${formatDate(selectedDate)}`;
        }
    }
    updateSaveBtnText();

    // 日期选择变化时更新按钮
    dateSelect.addEventListener('change', updateSaveBtnText);

    // 监听输入
    const textarea = document.getElementById('inputText');
    textarea.addEventListener('input', () => {
        const parsed = parseAnkiText(textarea.value);
        updatePreview(parsed);
        if (parsed) {
            updateSaveBtnText();
        }
    });

    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const parsed = parseAnkiText(textarea.value);
        if (!parsed) return;

        const selectedDate = dateSelect.value;

        if (dataCache[selectedDate]) {
            if (!confirm(`${formatDate(selectedDate)} 已有记录，是否覆盖？`)) return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        const success = await saveRecord(selectedDate, parsed);

        if (success) {
            textarea.value = '';
            updatePreview(null);
            updateStats();
            updateHistory();
            updateChart();
            showToast(`✓ 已保存到 ${formatDate(selectedDate)}`);
        }

        updateSaveBtnText();
        saveBtn.disabled = false;
    });

    // 清空按钮
    document.getElementById('clearBtn').addEventListener('click', () => {
        textarea.value = '';
        updatePreview(null);
    });

    // 图表切换
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentChartType = tab.dataset.chart;
            updateChart();
        });
    });

    // 导出
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // 导入
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importData(file);
        }
        e.target.value = '';
    });
});
