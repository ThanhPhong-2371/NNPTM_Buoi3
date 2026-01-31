const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State management
let allProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = null; // 'title' or 'price'
let sortOrder = 'asc'; // 'asc' or 'desc'
let searchQuery = '';

/**
 * Hàm lấy toàn bộ sản phẩm từ API
 */
async function getAllProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

/**
 * Lấy danh sách sản phẩm đã được lọc theo tìm kiếm
 */
function getFilteredProducts() {
    if (!searchQuery) return allProducts;
    return allProducts.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
}

/**
 * Hiển thị sản phẩm theo trang
 */
function displayPage() {
    const filteredProducts = getFilteredProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

    renderProducts(paginatedItems);
    updatePaginationControls(filteredProducts.length);
}

/**
 * Cập nhật trạng thái các nút phân trang
 */
function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('page-info').textContent = `Trang ${currentPage} / ${totalPages || 1}`;

    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Hiển thị sản phẩm lên bảng
 */
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không tìm thấy sản phẩm nào phù hợp.</td></tr>';
        return;
    }

    products.forEach((product, index) => {
        const tr = document.createElement('tr');

        // Ham lam sach URL tinh te hon
        function cleanUrl(url) {
            if (!url || typeof url !== 'string') return '';

            // Neu chuoi chua JSON (thuong gap: "["url"]")
            let cleaned = url;
            if (cleaned.startsWith('[') || cleaned.startsWith('"')) {
                try {
                    // Thu giai ma neu la chuoi JSON bi thieu/du ngoac
                    const parsed = JSON.parse(cleaned);
                    if (Array.isArray(parsed)) cleaned = parsed[0];
                    else cleaned = parsed;
                } catch (e) {
                    // Neu parse loi, dung regex xoa ky tu la
                    cleaned = cleaned.replace(/[\[\]"\\]/g, '').trim();
                }
            }

            // Xoa khoang trang va ky tu xuong dong
            cleaned = cleaned.trim().replace(/\s+/g, '');

            // Them giao thuc neu thieu (mot so link bat dau bang //)
            if (cleaned.startsWith('//')) cleaned = 'https:' + cleaned;

            // Neu khong phai link hop le thi bo qua
            if (!cleaned.startsWith('http')) return '';

            return cleaned;
        }

        // Xu ly mang hinh anh
        let allImageUrls = [];
        if (Array.isArray(product.images)) {
            product.images.forEach(img => {
                const cleaned = cleanUrl(img);
                if (cleaned) {
                    // Mot so link co the chua nhieu link cach nhau boi dau phay sau khi clean
                    if (cleaned.includes('http', 1)) {
                        // Truong hop link dam vao nhau: http...http...
                        const splitLinks = cleaned.split(/(?=http)/);
                        allImageUrls.push(...splitLinks);
                    } else {
                        allImageUrls.push(cleaned);
                    }
                }
            });
        }

        // Loai bo cac link trung lap
        allImageUrls = [...new Set(allImageUrls)];

        const imagesHtml = allImageUrls.map(url => {
            return `<img src="${url}" alt="${product.title}" class="product-img" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://placehold.co/60?text=Error';">`;
        }).join('');

        tr.innerHTML = `
            <td>${product.id}</td>
            <td>
                <div class="product-img-container">
                    ${imagesHtml || `<img src="https://placehold.co/60?text=No+Img" class="product-img">`}
                </div>
            </td>
            <td><strong>${product.title}</strong></td>
            <td><span class="price">$${product.price}</span></td>
            <td class="description-cell">${product.description}</td>
            <td>${product.category ? product.category.name : 'N/A'}</td>
        `;
        productList.appendChild(tr);
    });
}

/**
 * Sắp xếp sản phẩm
 */
function sortProducts(column) {
    if (sortColumn === column) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortOrder = 'asc';
    }

    allProducts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Handle case-insensitive string comparison for title
        if (column === 'title') {
            valA = (valA || '').toLowerCase();
            valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    currentPage = 1; // Reset to first page after sorting
    updateSortUI();
    displayPage();
}

/**
 * Cập nhật giao diện sắp xếp (icon và class active)
 */
function updateSortUI() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('active-sort');
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
    });

    const activeTh = document.querySelector(`.sortable[data-sort="${sortColumn}"]`);
    if (activeTh) {
        activeTh.classList.add('active-sort');
        const icon = activeTh.querySelector('.sort-icon');
        if (icon) icon.textContent = sortOrder === 'asc' ? '↑' : '↓';
    }
}

// Event Listeners
document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.getAttribute('data-sort');
        sortProducts(column);
    });
});

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    const totalItems = getFilteredProducts().length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.getElementById('page-size-select').addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1; // Reset to first page when changing page size
    displayPage();
});

document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1; // Reset to first page when searching
    displayPage();
});

// Khởi tạo dashboard
async function initDashboard() {
    allProducts = await getAllProducts();
    displayPage();
}

document.addEventListener('DOMContentLoaded', initDashboard);


