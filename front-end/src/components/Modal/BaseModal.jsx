import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  CloseButton,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalWrapper
} from "../../config/baseBoostrap";

const BaseModal = ({ isOpen, onClose, onApply, title, children }) => {
  if (!isOpen) return null;

  // ✅ Đóng modal khi nhấn bên ngoài
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}> 
      <ModalWrapper onClick={(e) => e.stopPropagation()}> 
        <ModalHeader>
          <h5 className="modal-title">{title}</h5>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-primary" onClick={onApply}>
            Áp dụng
          </button>
        </ModalFooter>
      </ModalWrapper>
    </ModalOverlay>
  );
};

export default BaseModal;
