// ==================== 认证相关函数 ====================

// 邮箱密码注册
async function signUp(email, password) {
    hideAuthError();
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });
    if (error) {
        showAuthError(error.message);
        return false;
    }
    if (data.user && !data.session) {
        showToast('注册成功！请查收验证邮件');
    }
    return true;
}

// 邮箱密码登录
async function signIn(email, password) {
    hideAuthError();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        showAuthError(error.message);
        return false;
    }
    return true;
}

// OAuth 登录
async function signInWithOAuth(provider) {
    hideAuthError();
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) {
        showAuthError(error.message);
    }
}

// 登出
async function signOut() {
    await supabaseClient.auth.signOut();
    dataCache = {};
    currentUser = null;
    isAppInitialized = false;  // 重置，允许下次登录时重新初始化
}

// 检查认证状态
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
        return true;
    } else {
        showAuthForm();
        return false;
    }
}

// 初始化应用（登录后调用）
async function initApp() {
    // 防止重复初始化 - 先检查再立即设置，避免竞态条件
    if (isAppInitialized) {
        console.log('initApp skipped: already initialized');
        return;
    }

    if (!isDomReady || !currentUser) {
        console.log('initApp skipped:', { isDomReady, hasUser: !!currentUser });
        return;
    }

    // 立即设置标志，防止并发调用
    isAppInitialized = true;
    console.log('initApp starting for user:', currentUser.email);
    showApp();

    try {
        hideLoadError();  // 隐藏之前的错误状态
        showLoading();    // 显示加载状态
        const data = await loadData();
        console.log('loadData returned:', Object.keys(data).length, 'records');

        updateStats();
        updateHistory();
        updateChart();
        hideLoading();    // 隐藏加载状态
        showToast('数据加载完成');
    } catch (e) {
        console.error('initApp error:', e);
        hideLoading();    // 隐藏加载状态
        showLoadError(e.message || '数据加载失败，请检查网络连接');
        isAppInitialized = false;  // 允许重试
    }
}

// 监听认证状态变化
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event, session?.user?.email);

    if (session) {
        currentUser = session.user;
        // 只在首次登录或刷新页面时初始化，跳过 TOKEN_REFRESHED 事件
        // TOKEN_REFRESHED 时 session 可能还在刷新中，此时发请求可能卡住
        if (isDomReady && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            await initApp();
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        dataCache = {};
        isAppInitialized = false;  // 重置初始化状态
        if (isDomReady) {
            showAuthForm();
        }
    }
});
