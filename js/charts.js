// ==================== 图表相关函数 ====================

// 填充缺失的日期，返回连续的日期数组
function fillMissingDates(dates) {
    if (dates.length === 0) return [];
    
    const sortedDates = [...dates].sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    const filledDates = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        filledDates.push(`${year}-${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return filledDates;
}

// 获取指定日期的数据，如果没有则返回零值
function getDataForDate(date) {
    if (dataCache[date]) {
        return dataCache[date];
    }
    // 返回零值数据
    return {
        duration: 0,
        cards: 0,
        avgSeconds: 0,
        retryCount: 0,
        retryPercent: 0,
        learn: 0,
        review: 0,
        relearn: 0,
        filtered: 0
    };
}

function updateChart() {
    const existingDates = Object.keys(dataCache).sort();

    if (existingDates.length === 0) {
        if (mainChart) {
            mainChart.destroy();
            mainChart = null;
        }
        return;
    }

    // 填充缺失的日期，取最近30天
    const allDates = fillMissingDates(existingDates).slice(-30);

    // 获取ISO周数（自然周，周一为一周开始）
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7; // 将周日从0改为7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum); // 调整到周四
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    // 星期几的中文映射（单字）
    const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    // X轴标签恢复简洁格式
    const labels = allDates.map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // 生成周卡片
    generateWeekCards(allDates, weekDayNames, getWeekNumber);

    const ctx = document.getElementById('mainChart').getContext('2d');

    if (mainChart) {
        mainChart.destroy();
    }

    let chartConfig;

    if (currentChartType === 'cards') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '卡片数量',
                    data: allDates.map(d => getDataForDate(d).cards),
                    borderColor: '#4a9eff',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        };
    } else if (currentChartType === 'duration') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '学习时长(分)',
                    data: allDates.map(d => getDataForDate(d).duration),
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        };
    } else if (currentChartType === 'avgTime') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '平均耗时(秒/张)',
                    data: allDates.map(d => getDataForDate(d).avgSeconds),
                    borderColor: '#9775fa',
                    backgroundColor: 'rgba(151, 117, 250, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        };
    } else if (currentChartType === 'retryCount') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '重来计数',
                    data: allDates.map(d => getDataForDate(d).retryCount),
                    borderColor: '#f783ac',
                    backgroundColor: 'rgba(247, 131, 172, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        };
    } else if (currentChartType === 'retry') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '重来比例(%)',
                    data: allDates.map(d => getDataForDate(d).retryPercent),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        };
    } else if (currentChartType === 'breakdown') {
        chartConfig = {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '学习',
                        data: allDates.map(d => getDataForDate(d).learn),
                        backgroundColor: '#4a9eff'
                    },
                    {
                        label: '复习',
                        data: allDates.map(d => getDataForDate(d).review),
                        backgroundColor: '#51cf66'
                    },
                    {
                        label: '重新学习',
                        data: allDates.map(d => getDataForDate(d).relearn),
                        backgroundColor: '#fcc419'
                    },
                    {
                        label: '已筛选',
                        data: allDates.map(d => getDataForDate(d).filtered),
                        backgroundColor: '#868e96'
                    }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                }
            }
        };
    }

    chartConfig.options = {
        ...chartConfig.options,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: currentChartType === 'breakdown'
            }
        }
    };

    mainChart = new Chart(ctx, chartConfig);
}

// 生成周卡片
function generateWeekCards(allDates, weekDayNames, getWeekNumber) {
    const container = document.getElementById('weekCardsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (allDates.length === 0) return;
    
    // 按周分组日期
    const weekGroups = [];
    let currentWeek = null;
    let currentGroup = null;
    
    allDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        const weekKey = `${year}-W${weekNum}`;
        
        if (currentWeek !== weekKey) {
            if (currentGroup) {
                weekGroups.push(currentGroup);
            }
            currentWeek = weekKey;
            currentGroup = {
                weekNum: weekNum,
                year: year,
                days: []
            };
        }
        
        currentGroup.days.push({
            date: date,
            dayName: weekDayNames[date.getDay()]
        });
    });
    
    if (currentGroup) {
        weekGroups.push(currentGroup);
    }
    
    // 为每个周生成卡片
    weekGroups.forEach((group, index) => {
        const card = document.createElement('div');
        card.className = `week-card color-${index % 6}`;
        
        const title = document.createElement('div');
        title.className = 'week-card-title';
        title.textContent = `W${group.weekNum}`;
        
        const daysContainer = document.createElement('div');
        daysContainer.className = 'week-card-days';
        
        group.days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'week-day';
            dayEl.textContent = day.dayName;
            daysContainer.appendChild(dayEl);
        });
        
        card.appendChild(title);
        card.appendChild(daysContainer);
        container.appendChild(card);
    });
}
