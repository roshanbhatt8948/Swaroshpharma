/* ==========================================================================
   SWAROSH PHARMACEUTICALS PRIVATE LIMITED - INTERACTIVE APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // 2. Initial Data Stores (No invented medicine or brand names - strictly empty until added by company)
    const INITIAL_PRODUCTS = [];

    // LocalStorage initialization for Products & Inquiries
    let products = JSON.parse(localStorage.getItem('swarosh_products')) || INITIAL_PRODUCTS;
    
    // Clear old fake product names if previously saved in localStorage
    if (products.some(p => p.name && p.name.startsWith('Swaro'))) {
        products = [];
        localStorage.setItem('swarosh_products', JSON.stringify([]));
    }

    let inquiries = JSON.parse(localStorage.getItem('swarosh_inquiries')) || [];

    // 3. Header Scroll Shrink & Mobile Navigation Menu
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close mobile nav on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Active Navigation Highlight
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');
            const navItem = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

            if (navItem) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navItem.classList.add('active');
                } else {
                    navItem.classList.remove('active');
                }
            }
        });
    });

    // 4. Product Directory Rendering & Search Engine
    const productsGrid = document.getElementById('products-grid');
    const searchInput = document.getElementById('product-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const categoryChips = document.querySelectorAll('.cat-chip');

    let currentCategory = 'ALL';
    let searchQuery = '';

    function renderProducts() {
        if (!productsGrid) return;

        const filtered = products.filter(prod => {
            const matchesCategory = (currentCategory === 'ALL') || (prod.category.toLowerCase() === currentCategory.toLowerCase());
            const term = searchQuery.toLowerCase().trim();
            const matchesSearch = !term || 
                prod.name.toLowerCase().includes(term) ||
                prod.composition.toLowerCase().includes(term) ||
                prod.category.toLowerCase().includes(term) ||
                prod.strength.toLowerCase().includes(term);

            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center p-8 bg-slate rounded-xl border border-color" style="grid-column: 1 / -1;">
                    <i data-lucide="shield-alert" style="width:48px;height:48px;color:var(--pharma-green);margin:0 auto 1rem auto;"></i>
                    <h3 class="title-md">Verified Wholesale Product Directory</h3>
                    <p class="text-muted text-sm mt-2 max-w-3xl" style="margin-left:auto;margin-right:auto;">
                        In compliance with Indian drug licensing laws, specific product lists, compositions, and pricing are supplied directly to licensed stockists, pharmacies, and institutional healthcare buyers upon verified request.
                    </p>
                    <div class="mt-4 flex gap-3 justify-center flex-wrap">
                        <a href="#partners" class="btn btn-primary btn-sm"><i data-lucide="send"></i> Request B2B Product Catalog</a>
                        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('open-admin-btn').click()"><i data-lucide="plus"></i> Add Product (Admin CMS)</button>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        productsGrid.innerHTML = filtered.map(prod => `
            <div class="product-card" data-id="${prod.id}">
                <div>
                    <span class="prod-tag">${escapeHtml(prod.category)}</span>
                    <h3 class="prod-title">${escapeHtml(prod.name)}</h3>
                    <p class="prod-comp">${escapeHtml(prod.composition)}</p>
                </div>
                
                <div>
                    <div class="prod-meta-list">
                        <div class="prod-meta-item">
                            <span class="prod-meta-label">Strength:</span>
                            <strong>${escapeHtml(prod.strength)}</strong>
                        </div>
                        <div class="prod-meta-item">
                            <span class="prod-meta-label">Dosage Form:</span>
                            <span>${escapeHtml(prod.form)}</span>
                        </div>
                        <div class="prod-meta-item">
                            <span class="prod-meta-label">Pack Size:</span>
                            <span>${escapeHtml(prod.pack)}</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary btn-sm w-full btn-open-enquiry" data-name="${escapeHtml(prod.name)}" data-id="${prod.id}">
                        <i data-lucide="send"></i> Request Quote / Enquiry
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();

        // Attach product enquiry triggers
        document.querySelectorAll('.btn-open-enquiry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prodName = e.currentTarget.getAttribute('data-name');
                const prodId = e.currentTarget.getAttribute('data-id');
                openEnquiryModal(prodName, prodId);
            });
        });
    }

    // Category Filter Click
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.getAttribute('data-cat');
            renderProducts();
        });
    });

    // Search Input Typing
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
            }
            renderProducts();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            renderProducts();
        });
    }

    // Initial Product Render
    renderProducts();

    // 5. MODAL CONTROL SYSTEM
    const modals = document.querySelectorAll('.modal');
    const modalCloses = document.querySelectorAll('.modal-close');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalCloses.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Product Enquiry Modal Trigger
    const productEnquiryModal = document.getElementById('product-enquiry-modal');
    function openEnquiryModal(prodName, prodId) {
        const nameInput = document.getElementById('enq-product-name');
        const idInput = document.getElementById('enq-product-id');
        if (nameInput) nameInput.value = prodName;
        if (idInput) idInput.value = prodId;
        openModal('product-enquiry-modal');
    }

    // Admin Modal Trigger & Switching
    const adminBtn = document.getElementById('open-admin-btn');
    const adminModal = document.getElementById('admin-modal');
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderAdminData();
            openModal('admin-modal');
        });
    }

    // Admin Tabs
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminTabContents = document.querySelectorAll('.admin-tab-content');

    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            adminTabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            const content = document.getElementById(target);
            if (content) content.classList.add('active');
        });
    });

    // Admin Product Management
    const btnShowAddProd = document.getElementById('btn-show-add-prod');
    const addProductForm = document.getElementById('add-product-form');
    const btnCancelAddProd = document.getElementById('btn-cancel-add-prod');

    if (btnShowAddProd && addProductForm) {
        btnShowAddProd.addEventListener('click', () => {
            addProductForm.classList.remove('hidden');
        });
    }
    if (btnCancelAddProd && addProductForm) {
        btnCancelAddProd.addEventListener('click', () => {
            addProductForm.classList.add('hidden');
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newProd = {
                id: 'p_' + Date.now(),
                name: document.getElementById('ap-name').value.trim(),
                composition: document.getElementById('ap-comp').value.trim(),
                strength: document.getElementById('ap-strength').value.trim(),
                form: document.getElementById('ap-form').value,
                category: document.getElementById('ap-cat').value,
                pack: document.getElementById('ap-pack').value.trim(),
                manufacturer: 'SWAROSH Authorized Distribution'
            };

            products.unshift(newProd);
            localStorage.setItem('swarosh_products', JSON.stringify(products));

            renderProducts();
            renderAdminProducts();
            addProductForm.reset();
            addProductForm.classList.add('hidden');
            showToast('New product added to catalog successfully!');
        });
    }

    function renderAdminProducts() {
        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.composition)}</td>
                <td>${escapeHtml(p.strength)}</td>
                <td><span class="prod-tag">${escapeHtml(p.category)}</span></td>
                <td>
                    <button class="btn-text text-danger delete-prod-btn" data-id="${p.id}"><i data-lucide="trash-2"></i> Delete</button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) lucide.createIcons();

        tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.currentTarget.getAttribute('data-id');
                products = products.filter(p => p.id !== pid);
                localStorage.setItem('swarosh_products', JSON.stringify(products));
                renderProducts();
                renderAdminProducts();
                showToast('Product removed from database.');
            });
        });
    }

    function renderAdminInquiries() {
        const container = document.getElementById('inquiries-list-container');
        const countSpan = document.getElementById('inquiry-count');
        if (countSpan) countSpan.textContent = inquiries.length;

        if (!container) return;

        if (inquiries.length === 0) {
            container.innerHTML = `
                <div class="text-center p-8 bg-slate rounded-xl">
                    <p class="text-muted">No inquiries received yet. Submit a test form on the B2B or Product page!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = inquiries.map((inq, idx) => `
            <div class="b2b-inq-card bg-slate p-4 rounded-lg mb-3 border border-color">
                <div class="flex-between mb-2">
                    <span class="badge hero-badge" style="margin:0;"><i data-lucide="tag"></i> ${escapeHtml(inq.type)}</span>
                    <span class="text-xs text-muted">${new Date(inq.date).toLocaleString()}</span>
                </div>
                <h5>${escapeHtml(inq.name || inq.company || 'Contact Inquiry')}</h5>
                <p class="text-sm text-muted mb-2"><strong>Contact:</strong> ${escapeHtml(inq.contactPerson || inq.name || '')} (${escapeHtml(inq.phone || '')}, ${escapeHtml(inq.email || '')})</p>
                <p class="text-sm bg-white p-2 rounded border border-color">${escapeHtml(inq.message || inq.requirements || inq.productName || '')}</p>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    function renderAdminData() {
        renderAdminProducts();
        renderAdminInquiries();
    }

    // Clear Inquiries
    const clearInqBtn = document.getElementById('clear-inquiries-btn');
    if (clearInqBtn) {
        clearInqBtn.addEventListener('click', () => {
            inquiries = [];
            localStorage.setItem('swarosh_inquiries', JSON.stringify(inquiries));
            renderAdminInquiries();
            showToast('All inquiries cleared.');
        });
    }

    // 6. FORM SUBMISSION HANDLERS
    // B2B Inquiry Form
    const b2bForm = document.getElementById('b2b-inquiry-form');
    if (b2bForm) {
        b2bForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inqObj = {
                type: 'B2B Partnership',
                company: document.getElementById('p-company').value.trim(),
                contactPerson: document.getElementById('p-contact').value.trim(),
                businessType: document.getElementById('p-type').value,
                phone: document.getElementById('p-phone').value.trim(),
                email: document.getElementById('p-email').value.trim(),
                location: document.getElementById('p-location').value.trim(),
                requirements: document.getElementById('p-req').value.trim(),
                date: new Date().toISOString()
            };
            saveInquiry(inqObj);
            b2bForm.reset();
            showToast('Thank you! Your B2B Partnership Inquiry has been received.');
        });
    }

    // General Contact Form
    const contactForm = document.getElementById('general-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inqObj = {
                type: 'General Contact',
                name: document.getElementById('c-name').value.trim(),
                company: document.getElementById('c-company').value.trim(),
                email: document.getElementById('c-email').value.trim(),
                phone: document.getElementById('c-phone').value.trim(),
                subject: document.getElementById('c-subject').value,
                message: document.getElementById('c-message').value.trim(),
                date: new Date().toISOString()
            };
            saveInquiry(inqObj);
            contactForm.reset();
            showToast('Message sent! Our corporate desk will contact you soon.');
        });
    }

    // Product Enquiry Modal Form
    const prodEnqForm = document.getElementById('product-enquiry-form');
    if (prodEnqForm) {
        prodEnqForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inqObj = {
                type: 'Product Quote',
                productName: document.getElementById('enq-product-name').value,
                quantity: document.getElementById('enq-qty').value.trim(),
                company: document.getElementById('enq-comp').value.trim(),
                phone: document.getElementById('enq-phone').value.trim(),
                email: document.getElementById('enq-email').value.trim(),
                message: document.getElementById('enq-msg').value.trim(),
                date: new Date().toISOString()
            };
            saveInquiry(inqObj);
            prodEnqForm.reset();
            closeModal(productEnquiryModal);
            showToast('Product enquiry submitted successfully!');
        });
    }

    // Careers Modal & Form
    const openCareersBtn = document.getElementById('open-careers-modal-btn');
    const careersForm = document.getElementById('careers-form');
    if (openCareersBtn) {
        openCareersBtn.addEventListener('click', () => {
            openModal('careers-modal');
        });
    }
    if (careersForm) {
        careersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inqObj = {
                type: 'Career Application',
                name: document.getElementById('car-name').value.trim(),
                email: document.getElementById('car-email').value.trim(),
                phone: document.getElementById('car-phone').value.trim(),
                dept: document.getElementById('car-dept').value,
                exp: document.getElementById('car-exp').value.trim(),
                message: document.getElementById('car-notes').value.trim(),
                date: new Date().toISOString()
            };
            saveInquiry(inqObj);
            careersForm.reset();
            closeModal(document.getElementById('careers-modal'));
            showToast('Application received! HR team will review your CV.');
        });
    }

    function saveInquiry(inqObj) {
        inquiries.unshift(inqObj);
        localStorage.setItem('swarosh_inquiries', JSON.stringify(inquiries));
    }

    // 7. LEGAL & COMPLIANCE MODAL
    const openLegalBtn = document.getElementById('open-legal-modal');
    const legalLinks = document.querySelectorAll('.legal-link');
    const legalModal = document.getElementById('legal-modal');
    const legalTitle = document.getElementById('legal-modal-title');
    const legalBody = document.getElementById('legal-modal-body');

    const LEGAL_CONTENTS = {
        privacy: {
            title: 'Privacy Policy - SWAROSH PHARMACEUTICALS PRIVATE LIMITED',
            html: `
                <p class="mb-4">SWAROSH PHARMACEUTICALS PRIVATE LIMITED respects the privacy of our business partners, stockists, and website visitors. This privacy policy outlines how we handle information submitted through our wholesale portal.</p>
                <h5 class="font-bold mb-2">1. Data Collection</h5>
                <p class="mb-4">We collect business contact information (Company Name, GST, Phone Number, Email) solely for transaction processing, order dispatch, and regulatory compliance.</p>
                <h5 class="font-bold mb-2">2. Use of Information</h5>
                <p class="mb-4">Collected details are used exclusively to process medicine supply enquiries, manage distribution agreements, and send critical trade updates.</p>
                <h5 class="font-bold mb-2">3. Statutory Disclosure</h5>
                <p>We do not sell or trade partner information to third parties. Information may only be shared with drug regulatory authorities upon statutory requirement.</p>
            `
        },
        terms: {
            title: 'Terms & Conditions - Wholesale Distribution',
            html: `
                <p class="mb-4">All transactions and business engagements with SWAROSH PHARMACEUTICALS PRIVATE LIMITED are governed by the Drugs and Cosmetics Act, 1940 and applicable Indian trade laws.</p>
                <h5 class="font-bold mb-2">1. Authorized Buyers Only</h5>
                <p class="mb-4">Pharmaceutical products are supplied exclusively to licensed wholesalers, stockists, retail chemists, and registered medical institutions holding valid Drug Licences.</p>
                <h5 class="font-bold mb-2">2. Batch Verification</h5>
                <p class="mb-4">Buyers must verify batch numbers, manufacturing dates, and seals upon receipt of goods.</p>
            `
        },
        disclaimer: {
            title: 'Statutory & Regulatory Disclaimer',
            html: `
                <p class="mb-4"><strong>SWAROSH PHARMACEUTICALS PRIVATE LIMITED</strong> is a licensed pharmaceutical wholesale distribution company.</p>
                <ul class="list-disc pl-5 mb-4">
                    <li>This website is intended for B2B trade enquiries, stockists, chemists, and institutional healthcare buyers.</li>
                    <li>We do NOT sell prescription medicines directly to individual retail consumers or patients.</li>
                    <li>No content on this website should be construed as medical advice or treatment recommendation.</li>
                </ul>
            `
        },
        sitemap: {
            title: 'Website Directory & Sitemap',
            html: `
                <ul class="space-y-2">
                    <li><a href="#home">Home - Main Portal</a></li>
                    <li><a href="#about">About SWAROSH PHARMACEUTICALS</a></li>
                    <li><a href="#products">Pharmaceutical Product Directory</a></li>
                    <li><a href="#therapeutic">Therapeutic Areas</a></li>
                    <li><a href="#distribution">Distribution Network</a></li>
                    <li><a href="#compliance">Quality & Compliance</a></li>
                    <li><a href="#partners">B2B Business Partnership</a></li>
                    <li><a href="#careers">Careers & HR</a></li>
                    <li><a href="#contact">Corporate Contact Desk</a></li>
                </ul>
            `
        }
    };

    function showLegal(type) {
        const item = LEGAL_CONTENTS[type] || LEGAL_CONTENTS.disclaimer;
        if (legalTitle) legalTitle.textContent = item.title;
        if (legalBody) legalBody.innerHTML = item.html;
        openModal('legal-modal');
    }

    if (openLegalBtn) {
        openLegalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLegal('disclaimer');
        });
    }

    legalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.getAttribute('data-legal');
            showLegal(type);
        });
    });

    // 8. TOAST NOTIFICATION UTILITY
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${escapeHtml(message)}</span>`;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Helper: HTML Escaper to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
