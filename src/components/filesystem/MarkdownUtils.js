// markdownUtils.js
// Handles parsing and serializing Markdown with optional YAML frontmatter

const matter = require('gray-matter');

// Parse a markdown file into frontmatter and content
function parseMarkdown(markdown) {
  const parsed = matter(markdown);
  return {
    frontmatter: parsed.data || {},
    content: parsed.content || '',
  };
}

// Serialize frontmatter + content into markdown format
function stringifyMarkdown({ frontmatter = {}, content = '' }) {
  return matter.stringify(content, frontmatter);
}

module.exports = {
  parseMarkdown,
  stringifyMarkdown,
};
