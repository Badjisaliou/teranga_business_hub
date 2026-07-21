const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function downloadAuthenticatedFile(path: string, token: string, fallbackFileName: string): Promise<void> {
  void token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "X-TBH-Portal": "admin",
    },
  });

  if (!response.ok) {
    throw new Error("Telechargement impossible.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename=\"([^\"]+)\"/i);
  const fileName = match?.[1] ?? fallbackFileName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
