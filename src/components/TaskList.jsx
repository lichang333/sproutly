import { useState } from 'react'
import { tasks as tasksApi } from '../lib/api'
import './TaskList.css'

const EMOJI_OPTIONS = ['📚', '✏️', '🔢', '🔬', '🎨', '🌍', '🎵', '💻']

export default function TaskList({ tasks, setTasks, onAddTask, onInterrupt, isTimerRunning, userToken }) {
  const [newTask, setNewTask] = useState('')
  const [newEmoji, setNewEmoji] = useState('📚')
  const [newPomodoros, setNewPomodoros] = useState(2)
  const [showInterrupt, setShowInterrupt] = useState(false)
  const [interruptNote, setInterruptNote] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editEmoji, setEditEmoji] = useState('📚')
  const [editPomodoros, setEditPomodoros] = useState(2)

  const addTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    onAddTask({ text: newTask.trim(), emoji: newEmoji, estimated_pomodoros: newPomodoros })
    setNewTask('')
    setNewPomodoros(2)
  }

  const completeTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true, doneAt: Date.now() } : t))
    if (userToken) tasksApi.update(id, { done: true }).catch(() => {})
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (userToken) tasksApi.delete(id).catch(() => {})
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditText(task.text)
    setEditEmoji(task.emoji)
    setEditPomodoros(task.estimated)
  }

  const saveEdit = () => {
    if (!editText.trim()) return
    setTasks(prev => prev.map(t =>
      t.id === editingId ? { ...t, text: editText.trim(), emoji: editEmoji, estimated: editPomodoros } : t
    ))
    if (userToken) tasksApi.update(editingId, {
      text: editText.trim(), emoji: editEmoji, estimated_pomodoros: editPomodoros
    }).catch(() => {})
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const submitInterrupt = () => {
    onInterrupt(interruptNote)
    setInterruptNote('')
    setShowInterrupt(false)
  }

  return (
    <div className="card task-card">
      <div className="task-header">
        <h2 className="section-title">📋 今日任务</h2>
        {isTimerRunning && (
          <button className="btn btn-ghost btn-sm interrupt-btn" onClick={() => setShowInterrupt(true)}>
            ⚡ 有事打断
          </button>
        )}
      </div>

      {/* List */}
      <div className="task-list">
        {tasks.length === 0 && (
          <div className="task-empty">还没有任务，加一个吧！📝</div>
        )}
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.done ? 'done' : ''} ${editingId === task.id ? 'editing' : ''}`}>
            {editingId === task.id ? (
              <div className="task-edit-form">
                <div className="task-edit-row">
                  <select value={editEmoji} onChange={e => setEditEmoji(e.target.value)} className="emoji-select emoji-select-sm">
                    {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input
                    className="input task-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                    autoFocus
                  />
                </div>
                <div className="task-edit-row">
                  <span className="form-label">番茄数：</span>
                  <div className="pomodoro-picker">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        className={`pomodoro-pick-btn ${editPomodoros === n ? 'active' : ''}`}
                        onClick={() => setEditPomodoros(n)}>
                        {'🌱'.repeat(n)}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={saveEdit}>保存</button>
                  <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>取消</button>
                </div>
              </div>
            ) : (
              <>
                <span className="task-emoji">{task.emoji}</span>
                <span className="task-text">{task.text}</span>
                <div className="task-tomatoes">
                  {Array.from({ length: task.estimated }).map((_, i) => (
                    <span key={i} className={`task-tomato-dot ${i < task.completed ? 'filled' : ''}`}>🌱</span>
                  ))}
                </div>
                {!task.done && (
                  <>
                    <button className="task-edit-btn" onClick={() => startEdit(task)} title="编辑">✏️</button>
                    <button className="task-check-btn" onClick={() => completeTask(task.id)} title="完成">✓</button>
                  </>
                )}
                <button className="task-del-btn" onClick={() => deleteTask(task.id)} title="删除">✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={addTask} className="task-form">
        <div className="task-form-row">
          <select
            value={newEmoji}
            onChange={e => setNewEmoji(e.target.value)}
            className="emoji-select"
          >
            {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="添加新任务，比如：数学作业"
            className="input task-input"
          />
        </div>
        <div className="task-form-row task-form-bottom">
          <span className="form-label">预计需要：</span>
          <div className="pomodoro-picker">
            {[1,2,3,4,5].map(n => (
              <button
                key={n} type="button"
                className={`pomodoro-pick-btn ${newPomodoros === n ? 'active' : ''}`}
                onClick={() => setNewPomodoros(n)}
              >{'🌱'.repeat(n)}</button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
            + 添加
          </button>
        </div>
      </form>

      {/* Interrupt modal */}
      {showInterrupt && (
        <div className="modal-overlay" onClick={() => setShowInterrupt(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">⚡</div>
            <h3 className="modal-title">先记下来！</h3>
            <p className="modal-desc">专注时间还没结束，先把这件事记录下来，休息时再处理哦！</p>
            <textarea
              value={interruptNote}
              onChange={e => setInterruptNote(e.target.value)}
              placeholder="记下打断你的事情..."
              className="input interrupt-textarea"
            />
            <div className="modal-actions">
              <button className="btn btn-ghost btn-full" onClick={() => setShowInterrupt(false)}>
                继续专注 💪
              </button>
              <button className="btn btn-tomato btn-full" onClick={submitInterrupt}>
                记录打断
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
