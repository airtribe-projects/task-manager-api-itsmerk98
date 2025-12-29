const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const tasksFile = path.join(__dirname, 'task.json');
let tasks = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to generate unique IDs
const generateId = () => {
    return tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
};

// Helper function to save tasks to file
const saveTasks = () => {
    try {
        const data = { tasks: tasks };
        fs.writeFileSync(tasksFile, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving tasks:', err);
    }
};

// Load tasks from file
try {
    if (fs.existsSync(tasksFile)) {
        const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
        tasks = data.tasks || [];
    } else {
        tasks = [];
        saveTasks(); // Create empty file
    }
} catch (err) {
    console.error('Error loading tasks:', err);
    tasks = [];
}

// --- Routes ---

// GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// GET /tasks/:id - Get a single task by ID
app.get('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
    const { title, description } = req.body;

    // Validation - both title and description are required
    if (!title || (typeof title === 'string' && title.trim() === '')) {
        return res.status(400).json({ error: 'Title is required' });
    }

    if (description === undefined || description === null || (typeof description === 'string' && description.trim() === '')) {
        return res.status(400).json({ error: 'Description is required' });
    }

    const newTask = {
        id: generateId(),
        title,
        description,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    res.status(201).json(newTask);
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, completed } = req.body;

    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Validation for update
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return res.status(400).json({ error: 'Title cannot be empty' });
    }

    // Validate completed is boolean if provided
    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
    }

    const updatedTask = {
        ...tasks[taskIndex],
        title: title !== undefined ? title : tasks[taskIndex].title,
        description: description !== undefined ? description : tasks[taskIndex].description,
        completed: completed !== undefined ? completed : tasks[taskIndex].completed
    };

    tasks[taskIndex] = updatedTask;
    saveTasks();
    res.json(updatedTask);
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(taskIndex, 1);
    saveTasks();
    res.json(deletedTask[0]);
});

// 404 Handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server only if this file is run directly
if (require.main === module) {
    app.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${port}`);
    });
}

module.exports = app;