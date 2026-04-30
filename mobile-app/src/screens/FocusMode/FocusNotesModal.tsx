import React from "react";
import { NotesWebViewModal } from "@/components/NotesWebViewModal";

interface FocusNotesModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}

export const FocusNotesModal = React.memo(function FocusNotesModal({
  isVisible,
  setIsVisible,
}: FocusNotesModalProps) {
  return (
    <NotesWebViewModal
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      titleKey="focusMode.focusNotes"
    />
  );
});
