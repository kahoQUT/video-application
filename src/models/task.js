const pool = require('../db');

exports.getAll = async () => {
  const conn = await pool.getConnection();
  const rows = await conn.query('SELECT * FROM tasks');
  conn.release();
  return rows;
};

exports.getById = async (id) => {
  const conn = await pool.getConnection();
  const rows = await conn.query('SELECT * FROM tasks WHERE id = ?', [id]);
  conn.release();
  return rows[0];
};

exports.create = async (title) => {
  const conn = await pool.getConnection();
  const result = await conn.query('INSERT INTO tasks (title, completed) VALUES (?, ?)', [title, 0]);
  conn.release();
  return { id: Number(result.insertId), title, completed: 0 };
};

exports.update = async (id, title, completed) => {
  const conn = await pool.getConnection();
  const result = await conn.query(
    'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
    [title, completed ? 1 : 0, id]
  );
  conn.release();
  return { updated: result.affectedRows > 0 };
};

exports.remove = async (id) => {
  const conn = await pool.getConnection();
  const result = await conn.query('DELETE FROM tasks WHERE id = ?', [id]);
  conn.release();
  return { deleted: result.affectedRows > 0 };
};
