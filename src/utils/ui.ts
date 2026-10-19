import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  // If the string contains no HTML tags, preserve it literally
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }
  let s = html;
  // Handle empty block elements with <br> between blocks (e.g. <div><br></div> representing double Enter):
  s = s.replace(/<\/(div|p|li|h[1-6])>[^\S\r\n]*<(div|p|li)[^>]*>[^\S\r\n]*<br\s*\/?>[^\S\r\n]*<\/\2>[^\S\r\n]*<(div|p|li|h[1-6])[^>]*>/gi, '\n\n');
  s = s.replace(/<(div|p|li)[^>]*>[^\S\r\n]*<br\s*\/?>[^\S\r\n]*<\/\1>/gi, '\n');
  // Transition between block elements (single Enter):
  s = s.replace(/<\/(div|p|li|h[1-6])>[^\S\r\n]*<(div|p|li|h[1-6])[^>]*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(div|p|li|h[1-6])>/gi, '\n');
  s = s.replace(/<(div|p|li|h[1-6])[^>]*>/gi, '\n');
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode entities
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  // Collapse excessive blank lines (3 or more newlines) down to double newline
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.replace(/^\n+/, '').replace(/\n+$/, '');
}
