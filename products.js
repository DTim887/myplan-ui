// 从后端API获取产品数据
async function fetchProductsData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/product/all`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('获取产品数据失败:', error);
        return [];
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async function() {
    const productList = document.getElementById('productList');
    
    // 获取并渲染产品数据
    const productsData = await fetchProductsData();
    renderProducts(productsData);
    
    // 渲染产品列表
    function renderProducts(products) {
        productList.innerHTML = '';
        
        if (products.length === 0) {
            productList.innerHTML = '<p class="no-results">暂无产品数据</p>';
            return;
        }
        
        products.forEach((product, index) => {
            // 处理图片路径
            let image = product.image;
            if (product.image && !product.image.startsWith('http')) {
                image = `${CONFIG.API_BASE_URL}${product.image}`;
            }
            
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <div class="product-image">
                    <img src="${image}" alt="${product.productName}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.productName}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-details">
                        <div class="product-price">价格: ¥${product.calendar[0].price}</div>
                        <div class="product-inventory">库存: ${product.calendar[0].inventory}</div>
                    </div>
                    <button class="calendar-button" data-product-id="${index}">查看日历</button>
                </div>
            `;
            productList.appendChild(item);
        });
        
        // 添加日历按钮事件监听器
        document.querySelectorAll('.calendar-button').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                showCalendar(products[productId]);
            });
        });
    }
    
    // 显示日历弹窗
    function showCalendar(product) {
        // 筛选2026年5月1日至31日的数据
        const calendarData = product.calendar.filter(item => {
            const date = new Date(item.date);
            const startDate = new Date('2026-05-01');
            const endDate = new Date('2026-05-31');
            return date >= startDate && date <= endDate;
        });
        
        // 创建弹窗元素
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'calendarModal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="modal-header">
                    <h3>${product.productName} - 价格与库存日历 (2026年5月)</h3>
                </div>
                <div class="calendar-grid">
                    ${calendarData.map(day => `
                        <div class="calendar-day">
                            <div class="date">${new Date(day.date).getDate()}日</div>
                            <div class="price">¥${day.price}</div>
                            <div class="inventory">库存: ${day.inventory}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 显示弹窗
        modal.style.display = 'block';
        
        // 添加关闭事件
        modal.querySelector('.close').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // 点击弹窗外部关闭
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
});