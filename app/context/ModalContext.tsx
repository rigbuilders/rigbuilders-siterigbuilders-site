"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ModalType = "success" | "error" | "info" | "warning";

interface ModalContextType {
  isOpen: boolean;
  modalContent: {
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void; // Optional: specific action on button click
  };
  openModal: (title: string, message: string, type?: ModalType, onConfirm?: () => void) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info" as ModalType,
    onConfirm: undefined as (() => void) | undefined,
  });

  const openModal = (title: string, message: string, type: ModalType = "info", onConfirm?: () => void) => {
    setModalContent({ title, message, type, onConfirm });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Slight delay to clear content after animation
    setTimeout(() => setModalContent({ ...modalContent, onConfirm: undefined }), 300);
  };

  return (
    <ModalContext.Provider value={{ isOpen, modalContent, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
};