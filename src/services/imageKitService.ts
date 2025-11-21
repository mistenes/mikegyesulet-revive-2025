const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isBrowser = typeof window !== "undefined";
const defaultBase = API_BASE || (isBrowser ? window.location.origin : "http://localhost");

type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
  folder?: string;
};

type UploadResponse = {
  url?: string;
  thumbnailUrl?: string;
};

export type ImageKitItem = {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    // ignore
  }

  if (!response.ok) {
    const message = (payload as { message?: string } | null)?.message || "Ismeretlen hiba történt";
    throw new Error(message);
  }

  return payload as T;
}

export async function getImageKitAuth(folder?: string): Promise<ImageKitAuth> {
  const params = new URLSearchParams();
  if (folder?.trim()) {
    params.set("folder", folder.trim());
  }

  const response = await fetch(
    new URL(`/api/gallery/imagekit-auth${params.size ? `?${params.toString()}` : ""}`, defaultBase).toString(),
    {
      credentials: "include",
    },
  );
  return handleResponse<ImageKitAuth>(response);
}

function buildUploadUrl(urlEndpoint: string) {
  return `${urlEndpoint.replace(/\/$/, "")}/api/v1/files/upload`;
}

export async function uploadToImageKit(file: File, folder?: string): Promise<string> {
  const auth = await getImageKitAuth(folder);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("fileName", file.name || "upload");
  formData.append("publicKey", auth.publicKey);
  formData.append("signature", auth.signature);
  formData.append("token", auth.token);
  formData.append("expire", auth.expire.toString());
  if (auth.folder) {
    formData.append("folder", auth.folder);
  }

  const response = await fetch(buildUploadUrl(auth.urlEndpoint), {
    method: "POST",
    body: formData,
  });

  const data = await handleResponse<UploadResponse>(response);
  if (!data.url) {
    throw new Error("Nem sikerült feltölteni a képet");
  }

  return data.url;
}

export type ImageKitBrowseResult = {
  items: ImageKitItem[];
  folder: string;
  baseFolder: string;
};

export async function listImageKitFiles(search?: string, path?: string): Promise<ImageKitBrowseResult> {
  const params = new URLSearchParams();
  if (search?.trim()) {
    params.set("search", search.trim());
  }
  if (path?.trim()) {
    params.set("path", path.trim());
  }

  const response = await fetch(
    new URL(`/api/gallery/imagekit-files${params.size ? `?${params.toString()}` : ""}`, defaultBase).toString(),
    {
      credentials: "include",
    },
  );

  const payload = await handleResponse<{ files?: ImageKitItem[]; folder?: string; baseFolder?: string }>(response);
  return {
    items: payload.files || [],
    folder: payload.folder || path || "",
    baseFolder: payload.baseFolder || "",
  };
}

export async function createImageKitFolder(parentPath: string, name: string): Promise<void> {
  const response = await fetch(new URL("/api/gallery/imagekit-folders", defaultBase).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ parentPath, name }),
  });

  await handleResponse(response);
}
