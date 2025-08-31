// 从后端API获取景点数据
async function fetchAttractionsData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/attraction/listAll`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('获取景点数据失败:', error);
        return [];
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async function() {
    const attractionsList = document.getElementById('attractionsList');
    
    // 获取并渲染景点数据
    const attractionsData = await fetchAttractionsData();
    renderAttractions(attractionsData);
    
    // 渲染景点列表
    function renderAttractions(attractions) {
        attractionsList.innerHTML = '';
        
        if (attractions.length === 0) {
            attractionsList.innerHTML = '<p class="no-results">暂无景点数据</p>';
            return;
        }
        
        attractions.forEach(attraction => {
            // 处理图片路径
            let image = attraction.image;
            if (attraction.image && !attraction.image.startsWith('http')) {
                image = `${CONFIG.API_BASE_URL}${attraction.image}`;
            }
            
            const item = document.createElement('div');
            item.className = 'attraction-item';
            item.innerHTML = `
                <img src="${image}" alt="${attraction.attractionName}" class="attraction-image">
                <div class="attraction-info">
                    <h3 class="attraction-name">${attraction.attractionName}</h3>
                    <div class="attraction-tags">
                        ${attraction.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="attraction-queue-time">排队时间: ${attraction.queueTime}分钟</div>
                </div>
            `;
            attractionsList.appendChild(item);
        });
    }
});