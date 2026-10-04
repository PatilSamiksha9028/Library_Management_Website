// API Base URL
const API_BASE = '/api';

// Application State Cache
let state = {
  books: [],
  members: [],
  issues: [],
  stats: {}
};

// DOM Content Loaded Initializer
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupNavigation();
  setupEventListeners();
  loadAllData();
});

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' 
    ? 'fa-circle-check' 
    : type === 'error' 
    ? 'fa-triangle-exclamation' 
    : 'fa-circle-info';
    
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Theme Management
function setupTheme() {
  const savedTheme = localStorage.getItem('athena_theme') || 'light';
  applyTheme(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      localStorage.setItem('athena_theme', nextTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }

  const toggleBtn = document.getElementById('theme-toggle');
  const themeText = document.getElementById('theme-text');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (theme === 'light') {
      if (icon) icon.className = 'fa-solid fa-moon';
      if (themeText) themeText.textContent = 'Dark Mode';
    } else {
      if (icon) icon.className = 'fa-solid fa-sun';
      if (themeText) themeText.textContent = 'Light Mode';
    }
  }
}

// Navigation Handling
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });
}

function switchView(viewName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });

  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  const titles = {
    dashboard: 'Dashboard Overview',
    books: 'Books Catalog & Inventory',
    issues: 'Circulation & Book Loans',
    members: 'Members Directory'
  };
  document.getElementById('current-view-title').textContent = titles[viewName] || 'Library Management';
}

// Fetch and Reload Data
async function loadAllData() {
  await Promise.all([
    fetchStats(),
    fetchBooks(),
    fetchMembers(),
    fetchIssues()
  ]);
  renderDashboard();
  renderBooks();
  renderIssues();
  renderMembers();
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    state.stats = await res.json();
    document.getElementById('stat-total-books').textContent = state.stats.totalBooksCount || 0;
    document.getElementById('stat-avail-books').textContent = state.stats.availableBooksCount || 0;
    document.getElementById('stat-active-issues').textContent = state.stats.activeIssues || 0;
    document.getElementById('stat-members').textContent = state.stats.totalMembers || 0;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function fetchBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    state.books = await res.json();
  } catch (err) {
    console.error('Failed to load books:', err);
  }
}

async function fetchMembers() {
  try {
    const res = await fetch(`${API_BASE}/members`);
    state.members = await res.json();
  } catch (err) {
    console.error('Failed to load members:', err);
  }
}

async function fetchIssues() {
  try {
    const res = await fetch(`${API_BASE}/issues`);
    state.issues = await res.json();
  } catch (err) {
    console.error('Failed to load issues:', err);
  }
}

// Render Dashboard
function renderDashboard() {
  const recentTable = document.getElementById('dashboard-recent-table');
  const recentIssues = state.issues.slice(0, 5);

  if (recentIssues.length === 0) {
    recentTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim);">No transactions recorded yet.</td></tr>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  recentTable.innerHTML = recentIssues.map(issue => {
    const isOverdue = issue.status === 'issued' && issue.dueDate < today;
    const badgeClass = issue.status === 'returned' ? 'returned' : (isOverdue ? 'overdue' : 'active');
    const badgeText = issue.status === 'returned' ? 'Returned' : (isOverdue ? 'Overdue' : 'Active Loan');

    return `
      <tr>
        <td><strong>${escapeHtml(issue.bookTitle)}</strong></td>
        <td>${escapeHtml(issue.memberName)}</td>
        <td>${issue.issueDate}</td>
        <td>${issue.dueDate}</td>
        <td><span class="status-pill ${badgeClass}">${badgeText}</span></td>
        <td>
          ${issue.status === 'issued' 
            ? `<button class="btn btn-success btn-sm" onclick="returnBook('${issue.id}')"><i class="fa-solid fa-rotate-left"></i> Return</button>`
            : `<span style="color: var(--text-dim); font-size: 0.85rem;"><i class="fa-solid fa-check"></i> Completed</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// Render Books Catalog
function renderBooks() {
  const container = document.getElementById('books-grid-container');
  const query = document.getElementById('books-search-input').value.toLowerCase().trim();
  const category = document.getElementById('books-category-filter').value;

  let filtered = state.books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(query) ||
                          b.author.toLowerCase().includes(query) ||
                          (b.isbn && b.isbn.toLowerCase().includes(query));
    const matchesCat = category === 'All' || b.category.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-dim);">
        <i class="fa-solid fa-book-open" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
        No books found matching your filter criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(book => {
    const isAvail = book.availableCopies > 0;
    const coverUrl = book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';

    return `
      <div class="book-card">
        <img class="book-cover" src="${coverUrl}" alt="${escapeHtml(book.title)}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'">
        <div class="book-content">
          <span class="book-category">${escapeHtml(book.category || 'General')}</span>
          <h4 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h4>
          <p class="book-author">by ${escapeHtml(book.author)} (${book.publishedYear || 'N/A'})</p>
          <div style="font-size: 0.76rem; color: var(--text-dim); margin-bottom: 10px;">
            ISBN: ${escapeHtml(book.isbn || 'N/A')}
          </div>
          <div class="book-meta">
            <span class="stock-badge ${isAvail ? 'available' : 'out'}">
              ${isAvail ? `${book.availableCopies} of ${book.totalCopies} Available` : 'All Issued Out'}
            </span>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" onclick="openEditBookModal('${book.id}')" title="Edit Book">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteBook('${book.id}')" title="Delete Book">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Issues / Circulation
function renderIssues() {
  const tbody = document.getElementById('issues-table-body');
  const query = document.getElementById('issues-search-input').value.toLowerCase().trim();
  const statusFilter = document.getElementById('issues-status-filter').value;
  const today = new Date().toISOString().split('T')[0];

  let filtered = state.issues.filter(i => {
    const matchesSearch = i.bookTitle.toLowerCase().includes(query) || i.memberName.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 32px;">No circulation records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(issue => {
    const isOverdue = issue.status === 'issued' && issue.dueDate < today;
    const badgeClass = issue.status === 'returned' ? 'returned' : (isOverdue ? 'overdue' : 'active');
    const badgeText = issue.status === 'returned' ? 'Returned' : (isOverdue ? 'Overdue' : 'Active Loan');

    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-dim);">${issue.id}</td>
        <td><strong>${escapeHtml(issue.bookTitle)}</strong></td>
        <td>${escapeHtml(issue.memberName)}</td>
        <td>${issue.issueDate}</td>
        <td>${issue.dueDate}</td>
        <td>${issue.returnDate || '<span style="color:var(--text-dim)">—</span>'}</td>
        <td><span class="status-pill ${badgeClass}">${badgeText}</span></td>
        <td>
          ${issue.status === 'issued'
            ? `<button class="btn btn-success btn-sm" onclick="returnBook('${issue.id}')"><i class="fa-solid fa-rotate-left"></i> Return Book</button>`
            : `<span style="color: var(--text-dim); font-size: 0.82rem;"><i class="fa-solid fa-check"></i> Completed</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// Render Members
function renderMembers() {
  const tbody = document.getElementById('members-table-body');
  const query = document.getElementById('members-search-input').value.toLowerCase().trim();

  let filtered = state.members.filter(m => {
    return m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 32px;">No members found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(member => {
    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-dim);">${member.id}</td>
        <td><strong>${escapeHtml(member.name)}</strong></td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(member.phone || 'N/A')}</td>
        <td><span class="book-category" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;">${escapeHtml(member.membershipType || 'Standard')}</span></td>
        <td>${member.joinedDate}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteMember('${member.id}')" title="Delete Member">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Event Listeners Configuration
function setupEventListeners() {
  // Search & Filters
  document.getElementById('books-search-input').addEventListener('input', renderBooks);
  document.getElementById('books-category-filter').addEventListener('change', renderBooks);
  document.getElementById('issues-search-input').addEventListener('input', renderIssues);
  document.getElementById('issues-status-filter').addEventListener('change', renderIssues);
  document.getElementById('members-search-input').addEventListener('input', renderMembers);

  // Quick Action in Header
  document.getElementById('btn-quick-issue').addEventListener('click', () => {
    populateIssueModalSelects();
    openModal('modal-issue');
  });

  // Add Book Button
  document.getElementById('btn-add-book').addEventListener('click', () => {
    document.getElementById('form-book').reset();
    document.getElementById('book-form-id').value = '';
    document.getElementById('modal-book-title').textContent = 'Add New Book';
    document.getElementById('btn-save-book').textContent = 'Save Book';
    openModal('modal-book');
  });

  // Issue Book Modal Open Button
  document.getElementById('btn-open-issue-modal').addEventListener('click', () => {
    populateIssueModalSelects();
    openModal('modal-issue');
  });

  // Add Member Button
  document.getElementById('btn-add-member').addEventListener('click', () => {
    document.getElementById('form-member').reset();
    openModal('modal-member');
  });

  // Book Form Submit
  document.getElementById('form-book').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('book-form-id').value;
    const bookData = {
      title: document.getElementById('book-input-title').value,
      author: document.getElementById('book-input-author').value,
      isbn: document.getElementById('book-input-isbn').value,
      category: document.getElementById('book-input-category').value,
      publishedYear: document.getElementById('book-input-year').value,
      totalCopies: document.getElementById('book-input-copies').value,
      coverImage: document.getElementById('book-input-cover').value
    };

    try {
      let res;
      if (id) {
        // Update existing book
        res = await fetch(`${API_BASE}/books/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      } else {
        // Add new book
        res = await fetch(`${API_BASE}/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save book');

      closeModal('modal-book');
      showToast(id ? 'Book details updated!' : 'New book added to catalog!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Issue Form Submit
  document.getElementById('form-issue').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      bookId: document.getElementById('issue-select-book').value,
      memberId: document.getElementById('issue-select-member').value,
      days: document.getElementById('issue-input-duration').value
    };

    try {
      const res = await fetch(`${API_BASE}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to issue book');

      closeModal('modal-issue');
      showToast('Book successfully issued!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Member Form Submit
  document.getElementById('form-member').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('member-input-name').value,
      email: document.getElementById('member-input-email').value,
      phone: document.getElementById('member-input-phone').value,
      membershipType: document.getElementById('member-select-type').value
    };

    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to register member');

      closeModal('modal-member');
      showToast('Member successfully registered!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Populate selects in Issue Modal
function populateIssueModalSelects() {
  const bookSelect = document.getElementById('issue-select-book');
  const memberSelect = document.getElementById('issue-select-member');

  const availableBooks = state.books.filter(b => b.availableCopies > 0);
  if (availableBooks.length === 0) {
    bookSelect.innerHTML = `<option value="">No books currently available</option>`;
  } else {
    bookSelect.innerHTML = availableBooks.map(b => `
      <option value="${b.id}">${escapeHtml(b.title)} (${b.availableCopies} available)</option>
    `).join('');
  }

  if (state.members.length === 0) {
    memberSelect.innerHTML = `<option value="">No registered members</option>`;
  } else {
    memberSelect.innerHTML = state.members.map(m => `
      <option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(m.email)})</option>
    `).join('');
  }
}

// Open Edit Book Modal
function openEditBookModal(bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('book-form-id').value = book.id;
  document.getElementById('book-input-title').value = book.title;
  document.getElementById('book-input-author').value = book.author;
  document.getElementById('book-input-isbn').value = book.isbn || '';
  document.getElementById('book-input-category').value = book.category || '';
  document.getElementById('book-input-year').value = book.publishedYear || '';
  document.getElementById('book-input-copies').value = book.totalCopies;
  document.getElementById('book-input-cover').value = book.coverImage || '';

  document.getElementById('modal-book-title').textContent = 'Edit Book Details';
  document.getElementById('btn-save-book').textContent = 'Update Book';
  openModal('modal-book');
}

// Delete Book
async function deleteBook(bookId) {
  if (!confirm('Are you sure you want to remove this book from the library catalog?')) return;

  try {
    const res = await fetch(`${API_BASE}/books/${bookId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete book');

    showToast('Book removed successfully', 'success');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Return Book
async function returnBook(issueId) {
  try {
    const res = await fetch(`${API_BASE}/issues/${issueId}/return`, { method: 'POST' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to process return');

    showToast('Book returned and stock replenished!', 'success');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Member
async function deleteMember(memberId) {
  if (!confirm('Are you sure you want to remove this member?')) return;

  try {
    const res = await fetch(`${API_BASE}/members/${memberId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to remove member');

    showToast('Member removed successfully', 'success');
    loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
