import React from 'react';

/**
 * Parses text and wraps HTTP/HTTPS URLs in clickable <a> tags.
 * Preserves newlines using React fragments if needed, but primarily 
 * designed to work with white-space: pre-wrap in CSS.
 */
export function renderTextWithLinks(text) {
  if (!text) return null;
  
  // URL regex (basic)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ color: '#2563eb', textDecoration: 'underline' }}
          onClick={(e) => e.stopPropagation()} // Prevent triggering parent click events
        >
          {part}
        </a>
      );
    }
    // Return regular text for non-URL parts
    return part;
  });
}
