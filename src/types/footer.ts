export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "custom";

export type SocialLink = {
  id: string;
  type: SocialPlatform;
  url: string;
  label?: string;
  enabled: boolean;
};

export type FooterContent = {
  socialLinks: SocialLink[];
};
