// 景点数据
const attractionsData = [
    {
        id: 1,
        name: "长城",
        image: "https://via.placeholder.com/300x200/4e6ef2/ffffff?text=长城",
        tags: ["历史", "文化", "世界遗产"],
        description: "中国古代的军事防御工程，被誉为世界七大奇迹之一。"
    },
    {
        id: 2,
        name: "故宫",
        image: "https://via.placeholder.com/300x200/ff6b6b/ffffff?text=故宫",
        tags: ["文化", "历史", "宫殿"],
        description: "明清两代的皇家宫殿，现为世界文化遗产。"
    },
    {
        id: 3,
        name: "西湖",
        image: "https://via.placeholder.com/300x200/51cf66/ffffff?text=西湖",
        tags: ["自然", "风景", "湖泊"],
        description: "中国著名的淡水湖泊，以其秀丽的湖光山色闻名。"
    },
    {
        id: 4,
        name: "黄山",
        image: "https://via.placeholder.com/300x200/ffd43b/ffffff?text=黄山",
        tags: ["自然", "山峰", "奇松"],
        description: "以奇松、怪石、云海、温泉四绝著称的名山。"
    },
    {
        id: 5,
        name: "兵马俑",
        image: "https://via.placeholder.com/300x200/e64980/ffffff?text=兵马俑",
        tags: ["历史", "考古", "博物馆"],
        description: "秦始皇陵的陪葬坑，被誉为世界第八大奇迹。"
    },
    {
        id: 6,
        name: "张家界",
        image: "https://via.placeholder.com/300x200/7950f2/ffffff?text=张家界",
        tags: ["自然", "山峰", "森林公园"],
        description: "以其独特的石英砂岩峰林地貌景观而闻名。"
    },
    {
        id: 7,
        name: "九寨沟",
        image: "https://via.placeholder.com/300x200/22b8cf/ffffff?text=九寨沟",
        tags: ["自然", "湖泊", "瀑布"],
        description: "以多彩的湖泊、瀑布群和雪山森林景观著称。"
    },
    {
        id: 8,
        name: "鼓浪屿",
        image: "https://via.placeholder.com/300x200/82c91e/ffffff?text=鼓浪屿",
        tags: ["文化", "海岛", "历史建筑"],
        description: "著名海滨旅游胜地，拥有众多历史建筑和自然景观。"
    }
];

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    const attractionsGrid = document.getElementById('attractionsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // 渲染所有景点
    renderAttractions(attractionsData);
    
    // 搜索功能
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 过滤功能
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新活动按钮状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 获取过滤类型
            const filterType = this.getAttribute('data-filter');
            
            // 过滤景点数据
            let filteredAttractions;
            if (filterType === 'all') {
                filteredAttractions = attractionsData;
            } else {
                filteredAttractions = attractionsData.filter(attraction => 
                    attraction.tags.includes(getTagName(filterType))
                );
            }
            
            // 渲染过滤后的景点
            renderAttractions(filteredAttractions);
        });
    });
    
    // 处理搜索
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            const filteredAttractions = attractionsData.filter(attraction =>
                attraction.name.toLowerCase().includes(searchTerm) ||
                attraction.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                attraction.description.toLowerCase().includes(searchTerm)
            );
            renderAttractions(filteredAttractions);
        } else {
            renderAttractions(attractionsData);
        }
    }
    
    // 根据过滤类型获取标签名称
    function getTagName(filterType) {
        const tagMap = {
            'nature': '自然',
            'culture': '文化',
            'history': '历史',
            'entertainment': '娱乐'
        };
        return tagMap[filterType] || '';
    }
    
    // 渲染景点列表
    function renderAttractions(attractions) {
        attractionsGrid.innerHTML = '';
        
        if (attractions.length === 0) {
            attractionsGrid.innerHTML = '<p class="no-results">未找到相关景点</p>';
            return;
        }
        
        attractions.forEach(attraction => {
            const card = document.createElement('div');
            card.className = 'attraction-card';
            card.innerHTML = `
                <img src="${attraction.image}" alt="${attraction.name}" class="attraction-image">
                <div class="attraction-info">
                    <h3 class="attraction-name">${attraction.name}</h3>
                    <div class="attraction-tags">
                        ${attraction.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <p class="attraction-description">${attraction.description}</p>
                </div>
            `;
            attractionsGrid.appendChild(card);
        });
    }
});