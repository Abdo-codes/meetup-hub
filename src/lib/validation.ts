export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const isValidSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isValidUrl = (value: string) => {
  if (!value) return true;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
};

export const isValidTwitter = (value?: string) => !value || /^[A-Za-z0-9_]{1,15}$/.test(value);
export const isValidGitHub = (value?: string) => !value || /^[A-Za-z0-9-]{1,39}$/.test(value);
