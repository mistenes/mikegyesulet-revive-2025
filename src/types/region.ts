export type RegionOrganizationInput = {
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
};

export type RegionInput = {
  id?: string;
  nameHu: string;
  nameEn?: string;
  imageUrl: string;
  organizations: RegionOrganizationInput[];
};

export type RegionOrganization = RegionOrganizationInput & {
  id?: string;
};

export type Region = RegionInput & {
  id: string;
  organizations: RegionOrganization[];
};
