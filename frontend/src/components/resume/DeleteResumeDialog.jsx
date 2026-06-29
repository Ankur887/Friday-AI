import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, AlertTriangle } from "lucide-react";

const DeleteResumeDialog = memo(({ open, resume, onConfirm, onClose }) => {
  return (
    <AnimatePresence>
      {open && resume && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal delete-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-dialog__icon-wrap">
              <AlertTriangle size={28} />
            </div>

            <div className="delete-dialog__content">
              <h3 className="delete-dialog__title">Delete Resume?</h3>
              <p className="delete-dialog__desc">
                <strong className="delete-dialog__name">{resume.name}</strong>{" "}
                will be permanently deleted. This action cannot be undone.
              </p>
            </div>

            <div className="modal__footer delete-dialog__footer">
              <button className="btn btn--ghost" onClick={onClose}>
                <X size={14} />
                Keep it
              </button>
              <button
                className="btn btn--danger"
                onClick={() => {
                  onConfirm(resume);
                  onClose();
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

DeleteResumeDialog.displayName = "DeleteResumeDialog";
export default DeleteResumeDialog;