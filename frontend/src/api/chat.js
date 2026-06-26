const API = "http://127.0.0.1:8000";

export async function createConversation(title, token) {
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API}/conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to create conversation");
  }

  return response.json();
}

export async function uploadFile(file, token = null) {
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API}/upload`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "File upload failed");
  }

  return response.json();
}

export async function sendMessage(
  conversationId,
  message,
  token = null,
  fileContent = null,
  fileName = null,
  fileType = null        // ← was missing
) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = {
    conversation_id: conversationId,
    message,
  };

  if (fileContent) {
    body.file_content = fileContent;
    body.file_name    = fileName || "uploaded_file";
    body.file_type    = fileType || "text";   // ← send to backend so PDF extraction works
  }

  const response = await fetch(`${API}/chat`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data.response;
}