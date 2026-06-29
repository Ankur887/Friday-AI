import { useState, useEffect } from "react";
import { templateService } from "../services/templateService";

export function useResumeTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    templateService.list().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  return { templates, loading };
}

export default useResumeTemplates;