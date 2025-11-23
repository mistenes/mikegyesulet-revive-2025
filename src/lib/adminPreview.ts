export const isAdminPreview = (): boolean => {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return window.parent !== window && params.get("adminPreview") === "1";
};

export const notifyAdminFocus = (sectionKey: string, fieldKey: string): boolean => {
  if (!isAdminPreview()) return false;

  window.parent?.postMessage(
    {
      type: "page-edit-focus",
      sectionKey,
      fieldKey,
      pathname: window.location.pathname,
    },
    window.location.origin,
  );

  return true;
};
