// ============================================
// APP STATE
// ============================================
const state = {
  tasks: [],
  currentFilter: 'all',
  currentSort: 'newest',
  categoryFilter: 'all',
  searchTerm: '',
  theme: 'light',
};

// ============================================
// DOM REFS
// ============================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ============================================
// LOCAL STORAGE
// ============================================
function loadTasks() {
  const data = localStorage.getItem('todoo_tasks');
  if (data) {
    try { state.tasks = JSON.parse(data); } catch { state.tasks = []; }
  } else {
    // Seed demo tasks
    state.tasks = [
      { id: Date.now() + 1, title: 'Design new landing page', description: 'Create Figma mockups for the new marketing page.', category: 'Work', priority: 'High', dueDate: '2026-07-15', completed: false, createdAt: Date.now() - 3600000 },
      { id: Date.now() + 2, title: 'Review project proposal', description: 'Check scope and budget for the Q3 project.', category: 'Work', priority: 'Medium', dueDate: '2026-07-12', completed: true, createdAt: Date.now() - 7200000 },
      { id: Date.now() + 3, title: 'Buy groceries for the week', description: 'Eggs, milk, bread, and fruits.', category: 'Shopping', priority: 'Low', dueDate: '2026-07-10', completed: false, createdAt: Date.now() - 1800000 },
      { id: Date.now() + 4, title: 'Study for JavaScript exam', description: 'Review closures and async/await.', category: 'Study', priority: 'High', dueDate: new Date().toISOString().split('T')[0], completed: false, createdAt: Date.now() - 86400000 },
      { id: Date.now() + 5, title: 'Book flight tickets', description: 'To New York for the conference.', category: 'Personal', priority: 'Medium', dueDate: '', completed: false, createdAt: Date.now() - 172800000 },
    ];
    saveTasks();
  }
}
function saveTasks() { localStorage.setItem('todoo_tasks', JSON.stringify(state.tasks)); }
 
// ============================================
// THEME
// ============================================
function loadTheme() {
  const saved = localStorage.getItem('todoo_theme');
  if (saved) state.theme = saved;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) state.theme = 'dark';
  applyTheme();
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeIcon = state.theme === 'dark' ? 'fa-sun' : 'fa-moon';
  $$('#themeToggleHeader i').forEach(i => { i.classList.remove('fa-sun', 'fa-moon'); i.classList.add(themeIcon); });
  localStorage.setItem('todoo_theme', state.theme);
  if (typeof renderChart === 'function') renderChart(); // Re-render chart for new theme colors
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}
// ============================================
// TOAST
// ============================================
function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

// ============================================
// TASK CRUD
// ============================================
function generateId() { return Date.now() + Math.random() * 1000; }

function addTask(task) {
  task.id = generateId(); 
  task.createdAt = Date.now();
  state.tasks.push(task);
  saveTasks();
  renderAll();
  showToast('Task created successfully', 'success');
}

function updateTask(id, updates) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    state.tasks[idx] = { ...state.tasks[idx], ...updates };
    saveTasks();
    renderAll();
    showToast('Task updated', 'info');
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  renderAll();
  showToast('Task deleted', 'warning');
}

function toggleComplete(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) {
    t.completed = !t.completed;
    saveTasks();
    renderAll();
    if (t.completed) showToast('Task marked as complete!', 'success');
  }
}

// ============================================
// FILTERS & SORT
// ============================================
function getFilteredTasks() {
  let list = [...state.tasks];
  // search
  if (state.searchTerm.trim()) {
    const s = state.searchTerm.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(s) || (t.description && t.description.toLowerCase().includes(s)));
  }
  // category
  if (state.categoryFilter !== 'all') {
    list = list.filter(t => t.category === state.categoryFilter);
  }
  // filter tabs
  switch (state.currentFilter) {
    case 'today': {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(t => t.dueDate === today);
      break;
    }
    case 'upcoming': {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(t => t.dueDate && t.dueDate > today);
      break;
    }
    case 'completed': list = list.filter(t => t.completed); break;
    case 'important': list = list.filter(t => t.priority === 'High'); break;
    default: break;
  }
  // sort
  switch (state.currentSort) {
    case 'newest': list.sort((a, b) => b.createdAt - a.createdAt); break;
    case 'oldest': list.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'priority': { const order = { High: 0, Medium: 1, Low: 2 }; list.sort((a,b) => (order[a.priority]||3) - (order[b.priority]||3)); break; }
    case 'dueDate': list.sort((a,b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1); break;
    default: break;
  }
  return list;
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderStats() {
  if (!document.getElementById('statsGrid')) return;
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const productivity = total ? Math.round((completed / total) * 100) : 0;
  
  $('#statTotal').textContent = total; 
  $('#statCompleted').textContent = completed; 
  $('#statPending').textContent = pending; 
  $('#statProductivity').textContent = `${productivity}%`; 
  
  // Streak (simple mock based on completed tasks)
  const streak = Math.min(completed, 7); // Capped at 7 for demo
  $('#streakCount').textContent = streak; 
  
  // Productivity Insight
  const insight = $('#insightText');
  if (insight) { 
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = state.tasks.filter(t => t.completed && t.dueDate === todayStr).length;

    if (total === 0) {
      insight.textContent = 'Ready to start? Add your first task and get things done!';
    } else if (completedToday > 0) {
      insight.textContent = `🎉 You've completed ${completedToday} task${completedToday > 1 ? 's' : ''} today. Fantastic work!`;
    } else if (productivity === 100) {
      insight.textContent = '🏆 All tasks completed! You are an absolute productivity machine!';
    } else if (productivity >= 80) {
      insight.textContent = '🔥 Amazing! You\'re crushing your goals.';
    } else if (productivity >= 50) {
      insight.textContent = '💪 Great progress! Keep up the momentum.';
    } else {
      insight.textContent = '🌱 Every completed task is a step forward. You can do it!';
    }
  }
}

function renderRecentTasks() {
  const list = getFilteredTasks().slice(0, 5);
  const container = $('#recentTaskList');
  if (!container) return;
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:40px 20px; background: transparent; border: none;"><i class="fas fa-check-circle"></i><p>All caught up!</p></div>`;
    return;
  }
  container.innerHTML = list.map(task => taskCardHTML(task)).join('');
}

function renderTaskList() {
  const list = getFilteredTasks();
  const container = $('#taskListContainer');
  const empty = $('#emptyState');
  if (!container) return;
  if (list.length === 0) {
    if (empty) empty.style.display = 'none'; // Hide it initially to prevent flash
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  container.innerHTML = list.map(task => taskCardHTML(task)).join('');
}

function taskCardHTML(task) {
  const priorityClass = `badge-${task.priority.toLowerCase()}`;
  const doneClass = task.completed ? 'done' : ''; 
  const checkedIcon = task.completed ? '<i class="fas fa-check"></i>' : '';
  return `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-check ${doneClass}" data-action="toggle">${checkedIcon}</div>
      <div class="task-info">
        <div class="task-title ${doneClass}">${task.title}</div>
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        <div class="task-meta">
          <span class="badge badge-category">${task.category || 'General'}</span>
          <span class="badge ${priorityClass}">${task.priority}</span>
          ${task.dueDate ? `<span><i class="far fa-calendar-alt"></i> ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button data-action="edit"><i class="fas fa-pen"></i></button>
        <button data-action="delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

// ============================================
// DASHBOARD CHART
// ============================================
let dashboardChart = null;
function renderChart() {
  const ctx = document.getElementById('dashboardChart');
  if (!ctx) return;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = state.tasks.length - completed;
  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#f1f5f9' : '#3b4a62';

  if (dashboardChart) { dashboardChart.destroy(); }
  dashboardChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ['#1dd1a1', '#6c5ce7'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, boxWidth: 12, padding: 20 }
        }
      },
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      cutout: '70%',
    }
  });
}

// ============================================
// MODAL LOGIC
// ============================================
let editingId = null;

function openModal(task = null) {
  const modal = $('#taskModal');
  const form = $('#taskForm');
  form.reset();
  editingId = null;
  $('#modalTitle').textContent = 'Add New Task';
  $('#saveTaskBtn').innerHTML = '<i class="fas fa-plus"></i> Add Task';
  if (task) {
    editingId = task.id;
    $('#modalTitle').textContent = 'Edit Task'; 
    $('#saveTaskBtn').innerHTML = '<i class="fas fa-pen"></i> Update';
    $('#taskTitle').value = task.title || '';
    $('#taskDesc').value = task.description || '';
    $('#taskCategory').value = task.category || 'Work';
    $('#taskPriority').value = task.priority || 'Medium';
    $('#taskDueDate').value = task.dueDate || '';
  }
  modal.classList.add('open');
}

function closeModal() {
  $('#taskModal').classList.remove('open');
  editingId = null;
}

function handleTaskSubmit(e) {
  e.preventDefault();
  const title = $('#taskTitle').value.trim();
  if (!title) { showToast('Title is required', 'warning'); return; }
  const taskData = {
    title,
    description: $('#taskDesc').value.trim(),
    category: $('#taskCategory').value,
    priority: $('#taskPriority').value,
    dueDate: $('#taskDueDate').value || '',
    completed: editingId ? state.tasks.find(t => t.id === editingId).completed : false,
  };
  if (editingId) {
    updateTask(editingId, taskData);
  } else {
    addTask(taskData);
  }
  closeModal();
}

// ============================================
// EVENT LISTENERS (delegation)
// ============================================
function setupEventListeners() {
  // Theme toggles
  $$('#themeToggleHeader').forEach(el => el.addEventListener('click', toggleTheme));

  // Mobile menu
  $('#mobileMenuBtn')?.addEventListener('click', () => {
    $('#sidebar').classList.toggle('open');
  });

  // Global search (dashboard)
  $('#globalSearch')?.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderRecentTasks();
  });

  // Task search (tasks page)
  $('#taskSearch')?.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderTaskList();
  });

  // Filter tabs (tasks page)
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter || 'all';
      renderTaskList();
    });
  });

  // Sort & category
  $('#sortSelect')?.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    renderTaskList();
  });
  $('#categoryFilter')?.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    renderTaskList();
  });

  // Sidebar nav filters (quick links)
  $$('.sidebar-nav .nav-link[data-filter]').forEach(link => {
    link.addEventListener('click', () => {
      // This now uses direct links in HTML, but this is a fallback/enhancement
      const filter = link.getAttribute('href').split('=')[1];
      if (filter) state.currentFilter = filter;
    });
  });

  // Add task buttons
  $('#addTaskBtn')?.addEventListener('click', () => openModal());
  $('#emptyAddBtn')?.addEventListener('click', () => openModal());

  // Modal controls
  $('#closeModalBtn')?.addEventListener('click', closeModal);
  $('#cancelModalBtn')?.addEventListener('click', closeModal);
  $('#taskModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  $('#taskForm')?.addEventListener('submit', handleTaskSubmit);

  // Task list actions (delegation)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const item = target.closest('.task-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    if (action === 'toggle') { toggleComplete(id); }
    else if (action === 'delete') { if (confirm('Delete task?')) deleteTask(id); }
    else if (action === 'edit') { 
      const task = state.tasks.find(t => t.id === id);
      if (task) openModal(task);
    }
  });

  // Notification bell
  $('#notificationBtn')?.addEventListener('click', () => {
    showToast('No new notifications', 'info');
  });
  
  // Settings link
  $('#settingsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Settings page coming soon!', 'info');
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    const sidebar = $('#sidebar');
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !$('#mobileMenuBtn').contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

// ============================================
// RENDER ALL
// ============================================
function renderAll() {
  const onDashboard = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
  const onTasksPage = window.location.pathname.includes('tasks.html');

  if (onDashboard) {
    renderStats();
    renderRecentTasks();
    renderChart();
    // Update greeting and date
    const hour = new Date().getHours();
    let greet = 'Good Evening';
    if (hour < 12) greet = 'Good Morning';
    else if (hour < 18) greet = 'Good Afternoon';
    $('#greeting').textContent = `${greet} 👋`;
    $('#currentDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  if (onTasksPage) {
    renderTaskList();
  }

  // Update page title on tasks page based on filter
  const pageTitle = $('.page-title');
  if (pageTitle && window.location.pathname.includes('tasks.html')) {
    const filterMap = { all: 'All Tasks', today: 'Today', upcoming: 'Upcoming', completed: 'Completed', important: 'Important' };
    pageTitle.textContent = filterMap[state.currentFilter] || 'All Tasks';
  }
}

// ============================================
// INIT
// ============================================
function init() {
  loadTheme();
  loadTasks();
  
  // Handle URL filter param for tasks page
  if (window.location.pathname.includes('tasks.html')) {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    const filterButton = filterParam ? $('.filter-btn[data-filter="' + filterParam + '"]') : null;

    if (filterButton) {
      state.currentFilter = filterParam;
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      filterButton.classList.add('active');
    }
  }

  setupEventListeners();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);