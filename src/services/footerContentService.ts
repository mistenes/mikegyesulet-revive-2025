import { readJson, writeJson } from "./storage";
import { FooterContent, SocialLink, SocialPlatform } from "@/types/footer";

const STORAGE_KEY = "mik-footer-content";

const defaultSocialLinks: SocialLink[] = [
  {
    id: "facebook-default",
    type: "facebook",
    url: "https://www.facebook.com",
    enabled: true,
  },
  {
    id: "instagram-default",
    type: "instagram",
    url: "https://www.instagram.com",
    enabled: true,
  },
  {
    id: "twitter-default",
    type: "twitter",
    url: "https://twitter.com",
    enabled: true,
  },
  {
    id: "youtube-default",
    type: "youtube",
    url: "https://www.youtube.com",
    enabled: true,
  },
];

const defaultContent: FooterContent = {
  socialLinks: defaultSocialLinks,
};

function randomId(prefix = "link") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getFooterContent(): FooterContent {
  const content = readJson<FooterContent>(STORAGE_KEY, defaultContent);
  return {
    socialLinks: content.socialLinks?.length ? content.socialLinks : defaultSocialLinks,
  };
}

export function saveFooterContent(content: FooterContent) {
  writeJson(STORAGE_KEY, content);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mik-footer-updated", { detail: content }));
  }
}

export function createEmptyLink(type: SocialPlatform = "facebook"): SocialLink {
  return {
    id: randomId("social"),
    type,
    url: "",
    enabled: true,
  };
}
