const Task = require('../models/task');

exports.getAllTasks = (req, res) => {
  Task.getAll()
    .then(rows => res.json(rows))
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.getTaskById = (req, res) => {
  Task.getById(req.params.id)
    .then(row => {
      if (!row) return res.status(404).json({ error: 'Task not found' });
      res.json(row);
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.createTask = (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  Task.create(title)
    .then(task => res.status(201).json(task))
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.updateTask = (req, res) => {
  const { title, completed } = req.body;

  Task.update(req.params.id, title, completed)
    .then(result => {
      if (!result.updated) return res.status(404).json({ error: 'Task not found' });
      res.json({ message: 'Task updated' });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.deleteTask = (req, res) => {
  Task.remove(req.params.id)
    .then(result => {
      if (!result.deleted) return res.status(404).json({ error: 'Task not found' });
      res.json({ message: 'Task deleted' });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};