// To-Do List Functionality
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const priorityInput = document.getElementById('priority-input');
const categoryInput = document.getElementById('category-input');
const reminderInput = document.getElementById('reminder-input');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const activeCount = document.getElementById('active-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingIndex = -1;

// Helper to create task item
function createTaskItem(task, index) {
  const li = document.createElement('li');
  li.className = `task-item flex items-center justify-between p-3 bg-white bg-opacity-90 rounded-lg ${task.done ? 'done' : ''}`;
  li.dataset.index = index;
  li.innerHTML = `
    <div class="flex items-center">
      <input type="checkbox" id="check-${index}" ${task.done ? 'checked' : ''} class="mr-3" aria-label="Mark task as done">
      <span class="task-text">${task.text}</span>
      <span class="priority ml-2 text-xs font-semibold text-white px-2 py-1 rounded-full bg-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'green'}-500">${task.priority}</span>
      <span class="category ml-2 text-xs font-semibold text-gray-500">${task.category}</span>
      ${task.reminder ? `<span class="reminder ml-2 text-xs font-semibold text-blue-500">Reminder: ${new Date(task.reminder).toLocaleString()}</span>` : ''}
    </div>
    <div>
      <button class="get-steps-btn bg-blue-500 text-white px-3 py-1 rounded ml-2" aria-label="Get task steps">Get Steps</button>
      <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded ml-2" aria-label="Delete task">Delete</button>
    </div>
  `;
  return li;
}

const sortPriority = document.getElementById('sort-priority');
const filterCategory = document.getElementById('filter-category');

// Render tasks
function renderTasks() {
  let filteredTasks = [...tasks];

  // Filter by category
  const category = filterCategory.value;
  if (category !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.category === category);
  }

  // Sort by priority
  const sortBy = sortPriority.value;
  if (sortBy === 'high') {
    filteredTasks.sort((a, b) => {
      const priorityA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
      const priorityB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
      return priorityB - priorityA;
    });
  } else if (sortBy === 'low') {
    filteredTasks.sort((a, b) => {
      const priorityA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
      const priorityB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
      return priorityA - priorityB;
    });
  }

  taskList.innerHTML = '';
  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<li class="text-center text-gray-400">No tasks yet!</li>`;
  } else {
    filteredTasks.forEach((task, index) => {
      const originalIndex = tasks.findIndex(t => t.text === task.text);
      taskList.appendChild(createTaskItem(task, originalIndex));
    });
  }
  updateCounts();
  populateCategories();
}

function populateCategories() {
  const currentValue = filterCategory.value;
  const categories = ['all', ...new Set(tasks.map(task => task.category))];
  filterCategory.innerHTML = '';
  categories.forEach(category => {
    if(category) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      filterCategory.appendChild(option);
    }
  });
  // Preserve the current selection or default to 'all'
  filterCategory.value = currentValue || 'all';
}

sortPriority.addEventListener('change', renderTasks);
filterCategory.addEventListener('change', renderTasks);

// Initial render
renderTasks();

// Event delegation for task actions
taskList.addEventListener('click', (e) => {
  const li = e.target.closest('li.task-item');
  if (!li) return;
  const index = parseInt(li.dataset.index, 10);

  if (e.target.matches('input[type="checkbox"]')) {
    tasks[index].done = e.target.checked;
    saveTasks();
    renderTasks();
  }
  if (e.target.matches('.delete-btn')) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
  if (e.target.matches('.get-steps-btn')) {
    getTaskSteps(tasks[index].text);
  }
});

// Mock function for Get Steps since API keys are invalid
async function getTaskSteps(taskText) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return mock steps
  const mockSteps = [
    `1. Research and plan how to ${taskText}.`,
    `2. Gather necessary resources for ${taskText}.`,
    `3. Execute the first step of ${taskText}.`,
    `4. Monitor progress and make adjustments.`,
    `5. Complete ${taskText} and review the outcome.`
  ];
  alert(`Mock Steps for "${taskText}":\n\n${mockSteps.join('\n')}`);
}

// Double-click to edit task
taskList.addEventListener('dblclick', (e) => {
  if (e.target.classList.contains('task-text')) {
    const li = e.target.closest('li.task-item');
    const index = parseInt(li.dataset.index, 10);
    startEditing(index);
  }
});

// Start editing a task
function startEditing(index) {
  if (editingIndex !== -1) return; // Prevent multiple edits
  editingIndex = index;
  const li = taskList.children[index];
  const task = tasks[index];

  const originalText = task.text;
  const originalPriority = task.priority;
  const originalCategory = task.category;
  const originalReminder = task.reminder;

  li.innerHTML = `
    <div class="flex items-center">
      <input type="text" value="${originalText}" class="task-edit-input flex-1 p-1 rounded border">
      <select class="priority-edit-input p-1 rounded border ml-2">
        <option value="low" ${originalPriority === 'low' ? 'selected' : ''}>Low</option>
        <option value="medium" ${originalPriority === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="high" ${originalPriority === 'high' ? 'selected' : ''}>High</option>
      </select>
      <input type="text" value="${originalCategory}" class="category-edit-input p-1 rounded border ml-2">
      <input type="datetime-local" value="${originalReminder ? new Date(originalReminder).toISOString().slice(0, 16) : ''}" class="reminder-edit-input p-1 rounded border ml-2">
    </div>
    <button class="save-edit-btn bg-green-500 text-white px-3 py-1 rounded ml-2">Save</button>
  `;

  const saveEdit = () => {
    const newText = li.querySelector('.task-edit-input').value.trim();
    const newPriority = li.querySelector('.priority-edit-input').value;
    const newCategory = li.querySelector('.category-edit-input').value.trim();
    const newReminder = li.querySelector('.reminder-edit-input').value;

    if (newText && !tasks.some((t, i) => i !== index && t.text === newText)) {
      tasks[index].text = newText;
      tasks[index].priority = newPriority;
      tasks[index].category = newCategory;
      tasks[index].reminder = newReminder;
      saveTasks();
    }
    editingIndex = -1;
    renderTasks();
  };

  li.querySelector('.save-edit-btn').addEventListener('click', saveEdit);
  li.querySelector('.task-edit-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') {
      editingIndex = -1;
      renderTasks();
    }
  });
}

// Save to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Update counts
function updateCounts() {
  const total = tasks.length;
  const active = tasks.filter(task => !task.done).length;
  const completed = total - active;
  taskCount.textContent = `Total tasks: ${total}`;
  activeCount.textContent = `Active: ${active}`;
  clearCompletedBtn.style.display = completed > 0 ? 'inline-block' : 'none';
}

// Clear completed tasks
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
});

// Add task with validation
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const priority = priorityInput.value;
  const category = categoryInput.value.trim();
  const reminder = reminderInput.value;
  if (text && !tasks.some(task => task.text === text)) {
    tasks.push({ text, priority, category, reminder, done: false });
    taskInput.value = '';
    categoryInput.value = '';
    reminderInput.value = '';
    saveTasks();
    renderTasks();
  } else if (!text) {
    alert('Task cannot be empty.');
  } else {
    alert('Task already exists.');
  }
});

// Initial render
renderTasks();

// Daily Reminder Functionality
const reminderHourInput = document.getElementById('reminder-hour');
const reminderMinuteInput = document.getElementById('reminder-minute');
const setReminderBtn = document.getElementById('set-reminder-btn');
const reminderStatus = document.getElementById('reminder-status');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');

let reminderTime = localStorage.getItem('reminderTime') ? JSON.parse(localStorage.getItem('reminderTime')) : null;
let lastReminderDate = localStorage.getItem('lastReminderDate') || null;
let reminderIntervalId = null;

// Load reminder settings and set UI
if (reminderTime) {
  reminderHourInput.value = reminderTime.hour;
  reminderMinuteInput.value = reminderTime.minute;
  reminderStatus.textContent = `Reminder: ${reminderTime.hour}:${String(reminderTime.minute).padStart(2, '0')}`;
}

// Check notification permission
if ('Notification' in window) {
  if (Notification.permission === 'granted') {
    enableNotificationsBtn.style.display = 'none';
    scheduleReminder();
  } else if (Notification.permission === 'default') {
    enableNotificationsBtn.style.display = 'inline-block';
  } else {
    reminderStatus.textContent = 'Notifications blocked.';
  }
} else {
  reminderStatus.textContent = 'Notifications not supported.';
}

// Enable notifications button
enableNotificationsBtn.addEventListener('click', () => {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      enableNotificationsBtn.style.display = 'none';
      scheduleReminder();
    } else {
      alert('Notification permission denied.');
    }
  });
});

// Set reminder
setReminderBtn.addEventListener('click', () => {
  const hour = parseInt(reminderHourInput.value);
  const minute = parseInt(reminderMinuteInput.value);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    alert('Please enter a valid hour (0-23) and minute (0-59).');
    return;
  }
  reminderTime = { hour, minute };
  localStorage.setItem('reminderTime', JSON.stringify(reminderTime));
  reminderStatus.textContent = `Reminder: ${hour}:${String(minute).padStart(2, '0')}`;
  if (Notification.permission === 'granted') {
    scheduleReminder();
  }
});

function scheduleReminder() {
  clearInterval(reminderIntervalId);
  if (!reminderTime) return;

  reminderIntervalId = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const today = now.toDateString();

    if (
      hour === reminderTime.hour &&
      minute === reminderTime.minute &&
      lastReminderDate !== today
    ) {
      sendReminder();
    }
  }, 60000); // Check every minute
}

// Send reminder
function sendReminder() {
  if (Notification.permission === 'granted') {
    new Notification('To-Do List Reminder', {
      body: 'Don\'t forget to check your to-do list!',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIwSDl2LTdhMSAxIDAgMCAxIDItLjg5NWMxLjMzLS42NCAyLjQzLTEuNTc0IDMuNy0yLjQ5OGEuOTk5LjEgMCAwIDEtLjlBMSEgMSAwIDAgMTIgNzYgMSAxIDAgMCAxIDE0IDYuMDE0YzAuNzctLjU3IDEuODMtMS4wIDEyLjcxIDIuMzc0YTEgMSAwIDAgMS0uOSAyLjExdjZoOFoiIGZpbGw9IiM2NjdlZWEiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSI1IiByPSI1IiBmaWxsPSIjNjY3ZWVhIi8+Cjwvc3ZnPg==' // Simple icon placeholder
    });
  } else {
    alert('Reminder: Don\'t forget to check your to-do list!');
  }
  lastReminderDate = new Date().toDateString();
  localStorage.setItem('lastReminderDate', lastReminderDate);
}

// Schedule on load if permission granted and time set
if (reminderTime && Notification.permission === 'granted') {
  scheduleReminder();
}

// ...existing code...

// Real-time clock
const clock = document.getElementById('clock');
function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Task-specific reminders
async function checkTaskReminders() {
  const now = new Date();
  console.log('Checking task reminders at:', now.toLocaleString());
  for (const task of tasks) {
    if (task.reminder && !task.done) {
      const reminderTime = new Date(task.reminder);
      console.log(`Task: ${task.text}, Reminder: ${reminderTime.toLocaleString()}, Now: ${now.toLocaleString()}`);
      if (now >= reminderTime && now - reminderTime < 60000) { // Within the last minute
        console.log('Reminder condition met for task:', task.text);
        alert(`Reminder for task: ${task.text}`);
        // Mark reminder as triggered to avoid repeated notifications
        task.reminder = null;
        saveTasks();
        renderTasks();
      }
    }
  }
}

// Check task reminders every second for more precise timing
setInterval(checkTaskReminders, 1000);

// ...existing code...
