import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import "./App.css";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const initialData = {
  todo: [],
  inProgress: [],
  done: []
};

function App() {
  const [data, setData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("data"));
    if (storedData) {
      setData(storedData);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("data", JSON.stringify(data));
  }, [data]);

  const handleDragStart = (result) => {
    const { draggableId } = result;
    const cardIndex = parseInt(draggableId.split("-")[1]);

    setData({
      ...data,
      draggedCardIndex: cardIndex,
      isDragging: true
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reorder within the same section
      const items = Array.from(data[source.droppableId]);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setData({ ...data, [source.droppableId]: items });
    } else {
      // Move to a different section
      const sourceItems = Array.from(data[source.droppableId]);
      const [movedItem] = sourceItems.splice(source.index, 1);

      const destinationItems = Array.from(data[destination.droppableId]);
      destinationItems.splice(destination.index, 0, movedItem);

      setData({
        ...data,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destinationItems
      });
    }
  };

  const handleAddCard = (section) => {
    const newCard = { title: "Task Name", description: "Task Description" };
    setData({ ...data, [section]: [...data[section], newCard] });
  };

  const handleEditCard = (section, index) => {
    const cardToEdit = data[section][index];
    setEditingCard({ ...cardToEdit, section, index });
  };

  const handleSaveCard = () => {
    handleCardChange(editingCard.section, editingCard.index, "title", editingCard.title);
    handleCardChange(editingCard.section, editingCard.index, "description", editingCard.description);
    setEditingCard(null);
  };

  const handleDeleteCard = (section, index) => {
    const items = Array.from(data[section]);
    items.splice(index, 1);
    setData({ ...data, [section]: items });
  };

  const handleCardChange = (section, index, field, value) => {
    const items = Array.from(data[section]);

    if (field === "isChecked") {
      // Set the isChecked property to false for all cards except the one being checked
      items.forEach((item, i) => {
        if (i === index) {
          item.isChecked = true;
        } else {
          item.isChecked = false;
        }
      });
    }

    items[index][field] = value;

    if (field === "isChecked" && value === true) {
      // Remove the checked card from the items array
      items.splice(index, 1);

      // Schedule a timeout to update the state
      setTimeout(() => {
        setData({ ...data, [section]: items });
      }, 0);
    } else {
      setData({ ...data, [section]: items });
    }
  };

  const getSectionTitle = (section) => {
    switch (section) {
      case "todo":
        return "To Do";
      case "inProgress":
        return "In Progress";
      case "done":
        return "Archived";
      default:
        return "";
    }
  };

  const filterCards = (cards) => {
    // Filter cards based on the search term
    return cards.filter((card) => {
      const cardTitle = card.title.toLowerCase();
      const cardDescription = card.description.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      return (
        cardTitle.includes(searchTermLower) ||
        cardDescription.includes(searchTermLower)
      );
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="title-bar">
          <h1>Todo List</h1>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="search-bar"
          />
        </div>
      </header>
      <div className="sections">
        {editingCard && (
          <Modal
            open={!!editingCard}
            onClose={() => setEditingCard(null)}
          >
            <Box sx={{width: '300px', margin: '1em auto', padding: '1em', backgroundColor: '#fff'}}>
              <h2>Edit Card</h2>
              <input
                type="text"
                value={editingCard.title}
                onChange={(e) => setEditingCard({...editingCard, title: e.target.value})}
              />
              <textarea
                value={editingCard.description}
                onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
              />
              <button onClick={handleSaveCard}>Save</button>
            </Box>
          </Modal>
        )}
        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {Object.entries(data).map(([section, cards]) => {
            if (!Array.isArray(cards)) {
              // Handle the case when cardsis not an array
              return null;
            }
            const filteredCards = filterCards(cards);
            return (
              <div key={section} className="section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <h2>{getSectionTitle(section)}</h2>
                  <button onClick={() => handleAddCard(section)}>
                    <span>&#43;</span>
                  </button>
                </div>
                <Droppable droppableId={section}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="card-list"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      {filteredCards.map((card, index) => (
                        <Draggable
                          key={`${section}-${index}`}
                          draggableId={`${section}-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <div className="card">
                                <div className="delete-container">
                                  <button
                                    className="edit-btn"
                                    onClick={() => handleEditCard(section, index)}
                                  >
                                    <EditIcon />
                                  </button>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteCard(section, index)}
                                  >
                                    <DeleteIcon />
                                  </button>
                                </div>
                                <div
                                  className="card-title"
                                  style={{
                                    boxShadow: card.title ? "none" : "0 0 0 2px #0079bf"
                                  }}
                                >
                                  {card.title}
                                </div>
                                <div
                                  className="card-description"
                                >
                                  {card.description}
                                </div>
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;