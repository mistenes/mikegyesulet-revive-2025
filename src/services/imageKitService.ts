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

export type ImageKitFile = {
  id: string;
  name: string;
  url: string;
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

export async function getImageKitAuth(): Promise<ImageKitAuth> {
  const response = await fetch(new URL("/api/gallery/imagekit-auth", defaultBase).toString(), {
    credentials: "include",
  });
  return handleResponse<ImageKitAuth>(response);
}

function buildUploadUrl(urlEndpoint: string) {
  return `${urlEndpoint.replace(/\/$/, "")}/api/v1/files/upload`;
}

export async function uploadToImageKit(file: File): Promise<string> {
  const auth = await getImageKitAuth();
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

export async function listImageKitFiles(search?: string): Promise<ImageKitFile[]> {
  const params = new URLSearchParams();
  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    new URL(`/api/gallery/imagekit-files${params.size ? `?${params.toString()}` : ""}`, defaultBase).toString(),
    {
      credentials: "include",
    },
  );

  const payload = await handleResponse<{ files?: ImageKitFile[] }>(response);
  return payload.files || [];
}
