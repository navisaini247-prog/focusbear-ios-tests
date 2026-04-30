import React from "react";
import { NotesWebViewModal } from "@/components/NotesWebViewModal";

export const NotesModal = ({ isVisible, setIsVisible }) => (
  <NotesWebViewModal
    isVisible={isVisible}
    setIsVisible={setIsVisible}
    titleKey="toDos.notes"
  />
);
