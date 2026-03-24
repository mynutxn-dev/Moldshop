import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="app-modal-overlay" onClick={onClose} />
      <div className={`app-modal-panel ${sizeClass} animate-scale-in`}>
        <div className="app-modal-header">
          <h2 className="app-modal-title">{title}</h2>
          <button onClick={onClose} className="app-modal-close">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="app-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
