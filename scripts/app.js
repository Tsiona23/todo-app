document.addEventListener('DOMContentLoaded', () => {

    // ---------- GET ELEMENTS SAFELY ----------
    const taskInput = document.getElementById('task-input');
    const taskCategory = document.getElementById('task-category');
    const taskDue = document.getElementById('task-due');
    const addBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const toggleDark = document.getElementById('toggle-dark');
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('main');

    // ---------- LOAD TASKS ----------
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // ---------- DARK MODE ----------
    if(toggleDark){
        if(localStorage.getItem('dark') === 'true'){
            document.body.classList.add('dark-mode');
            toggleDark.textContent = '☀️';
        } else {
            toggleDark.textContent = '🌙';
        }

        toggleDark.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            toggleDark.textContent = isDark ? '☀️' : '🌙';
            if(isDark) localStorage.setItem('dark','true');
            else localStorage.removeItem('dark');
        });
    }

    // ---------- HAMBURGER MENU ----------
    if(hamburger && sidebar){
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if(mainContent) mainContent.classList.toggle('shifted');
        });
    }

    // ---------- ADD TASK ----------
    if(addBtn && taskInput && taskCategory){
        addBtn.addEventListener('click', () => {
            if(!taskInput.value) return;
            const task = {
                id: Date.now(),
                text: taskInput.value,
                category: taskCategory.value,
                due: taskDue ? taskDue.value : '',
                completed: false,
                notified: false
            };
            tasks.push(task);
            saveTasks();
            taskInput.value = '';
            if(taskDue) taskDue.value = '';
        });
    }

    // ---------- SAVE & RENDER ----------
    function saveTasks(){
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateChart();
    }

    function categoryColor(cat){
        if(cat==='work') return '#F5A623';
        if(cat==='personal') return '#50E3C2';
        if(cat==='shopping') return '#4A90E2';
        return '#4A90E2';
    }

    // ---------- RENDER TASKS ----------
    function renderTasks(filter='all'){
        if(!taskList) return;
        taskList.innerHTML = '';
        const filtered = tasks.filter(t => filter==='all' ? true : t.category===filter);

        filtered.forEach(t => {
            const div = document.createElement('div');
            div.className = 'task';
            div.style.borderLeft = `6px solid ${categoryColor(t.category)}`;
            div.innerHTML = `
                <span>${t.text} ${t.due ? `(Due: ${new Date(t.due).toLocaleString()})` : ''}</span>
                <div>
                    <button onclick="toggleComplete(${t.id})">✅</button>
                    <button onclick="deleteTask(${t.id})">🗑️</button>
                </div>
            `;
            if(t.completed) div.classList.add('completed');

            taskList.appendChild(div);

            // Notifications
            if(t.due && new Date(t.due)<=new Date() && !t.notified){
                alert(`Task "${t.text}" is due!`);
                t.notified = true;
                saveTasks();
            }
        });
        updateSummary();
    }

    // ---------- COMPLETE & DELETE ----------
    window.toggleComplete = function(id){
        tasks = tasks.map(t => t.id===id ? {...t,completed:!t.completed} : t);
        saveTasks();
    }
    window.deleteTask = function(id){
        tasks = tasks.filter(t => t.id!==id);
        saveTasks();
    }

    // ---------- UPDATE SUMMARY ----------
    function updateSummary(){
        const totalEl = document.getElementById('total-tasks');
        const completedEl = document.getElementById('completed-tasks');
        const pendingEl = document.getElementById('pending-tasks');
        if(totalEl) totalEl.innerText = tasks.length;
        if(completedEl) completedEl.innerText = tasks.filter(t=>t.completed).length;
        if(pendingEl) pendingEl.innerText = tasks.filter(t=>!t.completed).length;
    }

    // ---------- CHART ----------
    let ctx = document.getElementById('taskChart')?.getContext('2d');
    let taskChart;
    if(ctx){
        taskChart = new Chart(ctx, {
            type:'doughnut',
            data:{labels:['Completed','Pending'], datasets:[{data:[0,0], backgroundColor:['#50E3C2','#F5A623']}]},
            options:{responsive:true, plugins:{legend:{position:'bottom'}}}
        });
    }
    function updateChart(){
        if(!taskChart) return;
        const completed = tasks.filter(t=>t.completed).length;
        const pending = tasks.filter(t=>!t.completed).length;
        taskChart.data.datasets[0].data = [completed,pending];
        taskChart.update();
    }

    // ---------- CATEGORY FILTER ----------
    document.querySelectorAll('.category').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.category').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks(e.target.dataset.cat);
        });
    });

    // ---------- INITIAL RENDER ----------
    renderTasks();
    updateChart();

});