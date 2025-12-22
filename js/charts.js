// ==================== 图表相关函数 ====================

function updateChart() {
    const dates = Object.keys(dataCache).sort().slice(-30);

    if (dates.length === 0) {
        if (mainChart) {
            mainChart.destroy();
            mainChart = null;
        }
        return;
    }

    const labels = dates.map(d => {
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
                    data: dates.map(d => dataCache[d].cards),
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
                    data: dates.map(d => dataCache[d].duration),
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
                    data: dates.map(d => dataCache[d].avgSeconds),
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
                    data: dates.map(d => dataCache[d].retryCount),
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
                    data: dates.map(d => dataCache[d].retryPercent),
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
                        data: dates.map(d => dataCache[d].learn),
                        backgroundColor: '#4a9eff'
                    },
                    {
                        label: '复习',
                        data: dates.map(d => dataCache[d].review),
                        backgroundColor: '#51cf66'
                    },
                    {
                        label: '重新学习',
                        data: dates.map(d => dataCache[d].relearn),
                        backgroundColor: '#fcc419'
                    },
                    {
                        label: '已筛选',
                        data: dates.map(d => dataCache[d].filtered),
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
