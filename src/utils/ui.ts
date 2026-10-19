import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  let s = html;

  // Preserve embedded media elements before tag stripping:
  const preservedMedia: string[] = [];
  s = s.replace(/<(iframe|picture|audio|video)[\s\S]*?<\/\1>/gi, (match) => {
    preservedMedia.push(match);
    return `__PRESERVED_MEDIA_${preservedMedia.length - 1}__`;
  });
  s = s.replace(/<(img|source)[^>]*\/?>/gi, (match) => {
    preservedMedia.push(match);
    return `__PRESERVED_MEDIA_${preservedMedia.length - 1}__`;
  });

  // Handle empty block elements with <br> between blocks (e.g. <div><br></div> representing double Enter):
  s = s.replace(/<\/(div|p|li|h[1-6])>[^\S\r\n]*<(div|p|li)[^>]*>[^\S\r\n]*<br\s*\/?>[^\S\r\n]*<\/\2>[^\S\r\n]*<(div|p|li|h[1-6])[^>]*>/gi, '\n\n');
  s = s.replace(/<(div|p|li)[^>]*>[^\S\r\n]*<br\s*\/?>[^\S\r\n]*<\/\1>/gi, '\n');
  // Transition between block elements (single Enter):
  s = s.replace(/<\/(div|p|li|h[1-6])>[^\S\r\n]*<(div|p|li|h[1-6])[^>]*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(div|p|li|h[1-6])>/gi, '\n');
  s = s.replace(/<(div|p|li|h[1-6])[^>]*>/gi, '\n');
  // Strip remaining formatting tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode entities
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  // Restore preserved media elements
  s = s.replace(/__PRESERVED_MEDIA_(\d+)__/g, (_, idx) => preservedMedia[Number(idx)]);

  // Collapse excessive blank lines (3 or more newlines) down to double newline
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.replace(/^\n+/, '').replace(/\n+$/, '');
}
