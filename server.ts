import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize SQLite Database
const db = new Database(path.join(__dirname, 'tasks.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL,
    workDate TEXT,
    completedDate TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

// Add orderIndex column if it doesn't exist
try {
  db.exec('ALTER TABLE tasks ADD COLUMN orderIndex INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY orderIndex ASC, createdAt DESC').all();
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const { title, description, category, status, workDate, completedDate } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Get min orderIndex to put new tasks at the top
    const minOrderRow = db.prepare('SELECT MIN(orderIndex) as minOrder FROM tasks').get() as any;
    const orderIndex = minOrderRow && minOrderRow.minOrder !== null ? minOrderRow.minOrder - 1 : 0;
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, category, status, workDate, completedDate, createdAt, updatedAt, orderIndex)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, title, description || '', category || 'Other', status || 'NOT_STARTED', workDate || null, completedDate || null, now, now, orderIndex);
    
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    broadcast({ type: 'TASK_CREATED', payload: newTask });
    res.status(201).json(newTask);
  });

  app.put('/api/tasks/reorder', (req, res) => {
    const { tasks } = req.body; // Array of { id, orderIndex }
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const updateStmt = db.prepare('UPDATE tasks SET orderIndex = ?, updatedAt = ? WHERE id = ?');
    const now = new Date().toISOString();
    
    const transaction = db.transaction((tasksToUpdate) => {
      for (const task of tasksToUpdate) {
        updateStmt.run(task.orderIndex, now, task.id);
      }
    });
    
    transaction(tasks);
    
    const updatedTasks = db.prepare('SELECT * FROM tasks ORDER BY orderIndex ASC, createdAt DESC').all();
    broadcast({ type: 'TASKS_REORDERED', payload: updatedTasks });
    res.json(updatedTasks);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    
    // Get existing task to merge with partial updates
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { 
      title = existingTask.title, 
      description = existingTask.description, 
      category = existingTask.category, 
      status = existingTask.status, 
      workDate = existingTask.workDate, 
      completedDate = existingTask.completedDate 
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, category = ?, status = ?, workDate = ?, completedDate = ?, updatedAt = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(title, description, category, status, workDate, completedDate, now, id);
    
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    broadcast({ type: 'TASK_UPDATED', payload: updatedTask });
    res.json(updatedTask);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    broadcast({ type: 'TASK_DELETED', payload: id });
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server for real-time sync
  const wss = new WebSocketServer({ server });

  function broadcast(message: any) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    console.log('Client connected for real-time sync');
    ws.on('close', () => console.log('Client disconnected'));
  });
}

startServer();
