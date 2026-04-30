const safeStringify = (data) => (typeof data === "string" ? data : JSON.stringify(data));

const safeParse = (data) => (typeof data === "string" ? JSON.parse(data) : data);

const normalizeUrl = (url) => {
  // Remove potential leading 'www.' and trailing slashes
  let formattedUrl = url.trim().toLowerCase();

  // If it doesn't contain a domain (dot), return null
  if (!formattedUrl.includes(".")) {
    return null;
  }

  // If it doesn't start with http:// or https://, add https://
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = "https://" + formattedUrl;
  }

  // Use regular expression to extract the domain
  const regex = /^(?:https?:\/\/)?(?:www\.)?([^/]+)/;
  const match = formattedUrl.match(regex);

  if (match && match[1]) {
    const domain = match[1];

    // Check if domain contains a period, ensuring it's a valid TLD like '.com', '.org', etc.
    if (domain.includes(".")) {
      return domain; // Return domain without 'www.'
    }
  }

  return null; // Return null if no valid domain found
};

export { safeStringify, safeParse, normalizeUrl };
