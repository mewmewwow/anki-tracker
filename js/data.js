// ==================== 数据操作函数 ====================

// 获取今天日期
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// 格式化日期显示
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekdays[date.getDay()]}`;
}

// 解析 Anki 统计文本
function parseAnkiText(text) {
    try {
        const cleanText = text.replace(/[\u2068\u2069]/g, '');

        const durationMatch = cleanText.match(/在\s*([\d.]+)\s*分/);
        const cardsMatch = cleanText.match(/学习了\s*([\d]+)\s*张/);
        const avgMatch = cleanText.match(/平均每张卡片\s*([\d.]+)\s*秒/);
        const retryMatch = cleanText.match(/「重来」计数[：:]\s*([\d]+)\s*\(([\d.]+)%\)/);
        const learnMatch = cleanText.match(/学习[：:]\s*([\d]+)/);
        const reviewMatch = cleanText.match(/复习[：:]\s*([\d]+)/);
        const relearnMatch = cleanText.match(/重新学习[：:]\s*([\d]+)/);
        const filteredMatch = cleanText.match(/已筛选[：:]\s*([\d]+)/);

        if (!durationMatch || !cardsMatch) {
            return null;
        }

        return {
            duration: parseFloat(durationMatch[1]),
            cards: parseInt(cardsMatch[1]),
            avgSeconds: avgMatch ? parseFloat(avgMatch[1]) : 0,
            retryCount: retryMatch ? parseInt(retryMatch[1]) : 0,
            retryPercent: retryMatch ? parseFloat(retryMatch[2]) : 0,
            learn: learnMatch ? parseInt(learnMatch[1]) : 0,
            review: reviewMatch ? parseInt(reviewMatch[1]) : 0,
            relearn: relearnMatch ? parseInt(relearnMatch[1]) : 0,
            filtered: filteredMatch ? parseInt(filteredMatch[1]) : 0
        };
    } catch (e) {
        console.error('解析错误:', e);
        return null;
    }
}

// 从 Supabase 加载数据
async function loadData() {
    if (!currentUser) {
        console.log('loadData: no currentUser');
        return {};
    }

    console.log('loadData: fetching for user', currentUser.id);

    try {
        const { data, error } = await supabaseClient
            .from('anki_records')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: true });

        if (error) {
            console.error('Supabase error:', JSON.stringify(error));
            throw new Error(error.message || JSON.stringify(error));
        }

        console.log('loadData: received', data?.length || 0, 'records');

        dataCache = {};
        if (data) {
            data.forEach(record => {
                dataCache[record.date] = {
                    duration: record.duration,
                    cards: record.cards,
                    avgSeconds: record.avg_seconds,
                    retryCount: record.retry_count,
                    retryPercent: record.retry_percent,
                    learn: record.learn,
                    review: record.review,
                    relearn: record.relearn,
                    filtered: record.filtered
                };
            });
        }
        return dataCache;
    } catch (e) {
        console.error('加载数据失败:', e.message || e);
        showToast('加载数据失败: ' + (e.message || '未知错误'));
        return {};
    }
}

// 保存数据到 Supabase
async function saveRecord(date, parsed) {
    if (!currentUser) return false;

    try {
        const record = {
            date: date,
            user_id: currentUser.id,
            duration: parsed.duration,
            cards: parsed.cards,
            avg_seconds: parsed.avgSeconds,
            retry_count: parsed.retryCount,
            retry_percent: parsed.retryPercent,
            learn: parsed.learn,
            review: parsed.review,
            relearn: parsed.relearn,
            filtered: parsed.filtered
        };

        const { data, error } = await supabaseClient
            .from('anki_records')
            .upsert(record, { onConflict: 'user_id,date' })
            .select();

        if (error) {
            console.error('Supabase save error:', JSON.stringify(error));
            throw new Error(error.message || JSON.stringify(error));
        }

        dataCache[date] = parsed;
        return true;
    } catch (e) {
        console.error('保存失败:', e.message || e);
        showToast('保存失败: ' + (e.message || '未知错误'));
        return false;
    }
}

// 删除记录
async function deleteRecord(date) {
    if (!currentUser) return;
    if (!confirm(`确定删除 ${formatDate(date)} 的记录吗？`)) return;

    try {
        const { error } = await supabaseClient
            .from('anki_records')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('date', date);

        if (error) {
            console.error('Supabase delete error:', JSON.stringify(error));
            throw new Error(error.message || JSON.stringify(error));
        }

        delete dataCache[date];
        updateStats();
        updateHistory();
        updateChart();
        showToast('已删除');
    } catch (e) {
        console.error('删除失败:', e.message || e);
        showToast('删除失败: ' + (e.message || '未知错误'));
    }
}

// 导出数据
function exportData() {
    const blob = new Blob([JSON.stringify(dataCache, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki-tracker-${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出');
}

// 导入数据（批量处理）
async function importData(file) {
    if (!currentUser) {
        showToast('请先登录');
        return;
    }

    try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        // 准备批量数据
        const records = Object.entries(importedData).map(([date, record]) => ({
            date: date,
            user_id: currentUser.id,
            duration: record.duration,
            cards: record.cards,
            avg_seconds: record.avgSeconds,
            retry_count: record.retryCount,
            retry_percent: record.retryPercent,
            learn: record.learn,
            review: record.review,
            relearn: record.relearn,
            filtered: record.filtered
        }));

        if (records.length === 0) {
            showToast('没有可导入的数据');
            return;
        }

        showToast(`正在导入 ${records.length} 条记录...`);

        // 批量 upsert（一次性提交）
        const { error } = await supabaseClient
            .from('anki_records')
            .upsert(records, { onConflict: 'user_id,date' });

        if (error) {
            console.error('Supabase batch import error:', JSON.stringify(error));
            throw new Error(error.message || JSON.stringify(error));
        }

        // 刷新本地缓存
        await loadData();
        updateStats();
        updateHistory();
        updateChart();
        showToast(`✓ 已导入 ${records.length} 条记录`);
    } catch (e) {
        console.error('导入失败:', e);
        showToast('导入失败：' + (e.message || '无效的 JSON 文件'));
    }
}
