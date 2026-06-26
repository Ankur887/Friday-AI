import { memo, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import ResumeProgress from "./ResumeProgress";

const ACCEPTED = [".pdf", ".docx", ".doc"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadResumeModal = memo(({ open, onClose, onComplete }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  const validate = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext))
      return "Only PDF, DOCX, and DOC files are supported.";
    if (f.size > MAX_SIZE) return "File size must be under 10MB.";
    return "";
  };

  const handleFile = useCallback((f) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError("");
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const startProcessing = async () => {
    if (!file) return;
    setProcessing(true);
    const STAGE_COUNT = 7;
    for (let i = 0; i < STAGE_COUNT; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
    }
    setProcessing(false);
    onComplete?.({ file, name: file.name.replace(/\.[^.]+$/, "") });
  };

  const reset = () => {
    setFile(null);
    setError("");
    setStage(-1);
    setProcessing(false);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal upload-modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal__header">
              <div>
                <h2 className="modal__title">Upload Resume</h2>
                <p className="modal__subtitle">
                  PDF, DOCX, or DOC · Max 10MB
                </p>
              </div>
              {!processing && (
                <button className="modal__close" onClick={handleClose}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="modal__body">
              {/* Processing view */}
              {processing || stage === 6 ? (
                <ResumeProgress stage={stage} filename={file?.name} />
              ) : (
                <>
                  {/* Drop zone */}
                  {!file ? (
                    <div
                      className={`upload-modal__dropzone ${
                        dragging ? "upload-modal__dropzone--active" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      onClick={() => inputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED.join(",")}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f);
                        }}
                      />
                      <motion.div
                        className="upload-modal__icon"
                        animate={dragging ? { scale: 1.15 } : { scale: 1 }}
                      >
                        <Upload size={32} />
                      </motion.div>
                      <p className="upload-modal__drop-label">
                        {dragging
                          ? "Release to upload"
                          : "Drag & drop your resume here"}
                      </p>
                      <p className="upload-modal__drop-sub">
                        or{" "}
                        <span className="upload-modal__browse">
                          browse files
                        </span>
                      </p>
                    </div>
                  ) : (
                    /* File selected state */
                    <div className="upload-modal__file-ready">
                      <div className="upload-modal__file-icon">
                        <FileText size={28} />
                      </div>
                      <div className="upload-modal__file-info">
                        <span className="upload-modal__file-name">
                          {file.name}
                        </span>
                        <span className="upload-modal__file-size">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        className="upload-modal__file-remove"
                        onClick={reset}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="upload-modal__error">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!processing && stage !== 6 && (
              <div className="modal__footer">
                <button className="btn btn--ghost" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  onClick={startProcessing}
                  disabled={!file || !!error}
                >
                  <Upload size={14} />
                  Upload & Process
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

UploadResumeModal.displayName = "UploadResumeModal";
export default UploadResumeModal;