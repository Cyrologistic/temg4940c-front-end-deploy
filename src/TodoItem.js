import React from 'react';

function TodoItem({ id, title, description }) {
  return (
    <div className="todo-item" key={id}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default TodoItem;