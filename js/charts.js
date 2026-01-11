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

// 获取周数（周日为一周的第一天）
function getWeekNumber(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // 将日期调整到本周的周日
    const dayOfWeek = d.getDay(); // 周日=0, 周一=1, ...
    d.setDate(d.getDate() - dayOfWeek); // 回到本周的周日
    // 找到该年的1月1日
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // 计算该年1月1日是周几，并调整到那一周的周日
    const yearStartDay = yearStart.getDay();
    yearStart.setDate(yearStart.getDate() - yearStartDay);
    // 计算周数
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNum;
}

// 星期几的中文映射（单字），周日作为第一天
const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

// Chart.js 插件：在图表顶部绘制周几和周数
const weekInfoPlugin = {
    id: 'weekInfoPlugin',
    afterDraw: function(chart) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const chartArea = chart.chartArea;
        
        if (!xScale || !chart.data.weekData) return;
        
        const weekData = chart.data.weekData;
        const weekGroups = chart.data.weekGroups;
        
        ctx.save();
        
        // 绘制每个数据点对应的星期几
        const fontSize = 10;
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#868e96';
        
        weekData.forEach((day, index) => {
            const x = xScale.getPixelForValue(index);
            const y = chartArea.top - 8;
            ctx.fillText(day.dayName, x, y);
        });
        
        // 绘制周数标签（只在每周的中间位置显示一次）
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#495057';
        
        weekGroups.forEach(group => {
            // 计算该周所有日期的中间位置
            const startX = xScale.getPixelForValue(group.startIndex);
            const endX = xScale.getPixelForValue(group.endIndex);
            const centerX = (startX + endX) / 2;
            const y = chartArea.top - 20;
            ctx.fillText(`W${group.weekNum}`, centerX, y);
        });
        
        ctx.restore();
    }
};

// 注册插件
Chart.register(weekInfoPlugin);

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

    // X轴标签：简洁的月/日格式
    const labels = allDates.map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // 准备周数据（每个日期对应的星期几）
    const weekData = allDates.map(d => {
        const date = new Date(d);
        return {
            date: date,
            dayName: weekDayNames[date.getDay()],
            weekNum: getWeekNumber(date)
        };
    });
    
    // 按周分组（用于显示周数标签）
    const weekGroups = [];
    let currentWeekNum = null;
    let currentGroup = null;
    
    weekData.forEach((day, index) => {
        if (currentWeekNum !== day.weekNum) {
            if (currentGroup) {
                currentGroup.endIndex = index - 1;
                weekGroups.push(currentGroup);
            }
            currentWeekNum = day.weekNum;
            currentGroup = {
                weekNum: day.weekNum,
                startIndex: index,
                endIndex: index
            };
        } else {
            currentGroup.endIndex = index;
        }
    });
    
    if (currentGroup) {
        weekGroups.push(currentGroup);
    }

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
                weekData,
                weekGroups,
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
                weekData,
                weekGroups,
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
                weekData,
                weekGroups,
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
                weekData,
                weekGroups,
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
                weekData,
                weekGroups,
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
                weekData,
                weekGroups,
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

    // 配置图表顶部留出空间显示周几和周数
    chartConfig.options = {
        ...chartConfig.options,
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 32 // 为周几和周数留出空间
            }
        },
        plugins: {
            legend: {
                display: currentChartType === 'breakdown'
            }
        }
    };

    mainChart = new Chart(ctx, chartConfig);
}
