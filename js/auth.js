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
    // 防止重复初始化
    if (isAppInitialized) {
        console.log('initApp skipped: already initialized');
        return;
    }

    if (!isDomReady || !currentUser) {
        console.log('initApp skipped:', { isDomReady, hasUser: !!currentUser });
        return;
    }

    isAppInitialized = true;
    console.log('initApp starting for user:', currentUser.email);
    showApp();

    try {
        const data = await loadData();
        console.log('loadData returned:', Object.keys(data).length, 'records');

        updateStats();
        updateHistory();
        updateChart();
        showToast('数据加载完成');
    } catch (e) {
        console.error('initApp error:', e);
        isAppInitialized = false;  // 允许重试
    }
}

// 监听认证状态变化
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event, session?.user?.email);

    if (session) {
        currentUser = session.user;
        // DOM 准备好后才初始化应用
        if (isDomReady) {
            await initApp();
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        dataCache = {};
        if (isDomReady) {
            showAuthForm();
        }
    }
});
