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

    const labels = allDates.map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });

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
