#!/usr/bin/env node
// Offline, dependency-free checks for the repository's intentionally simple
// Agent Skills frontmatter and documentation links. Not a general YAML parser.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(repo, '.agents', 'skills');
const catalogFile = join(repo, 'SKILLS.md');
const errors = [];
const required = [
  'workstation-bootstrap',
  'mise-module-authoring',
  'credential-setup',
  'cloud-development',
  'workstation-diagnostics',
];

function requireFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    errors.push(`Missing file: ${path}`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

function checkLinks(path, content) {
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const href = match[1].split('#', 1)[0].trim();
    if (!href || /^(https?:\/\/|mailto:)/i.test(href)) continue;
    if (href.startsWith('/')) {
      errors.push(`${path}: absolute Markdown link is not portable: ${href}`);
      continue;
    }
    const target = resolve(dirname(path), decodeURIComponent(href));
    if (!existsSync(target)) errors.push(`${path}: broken link: ${href}`);
  }
}

const names = existsSync(skillsDir) ? readdirSync(skillsDir).filter((name) => {
  return statSync(join(skillsDir, name)).isDirectory();
}).sort() : [];
const catalog = requireFile(catalogFile);
const agentInstructions = requireFile(join(repo, 'AGENTS.md'));
for (const name of required) {
  if (!names.includes(name)) errors.push(`Required skill directory missing: ${name}`);
}
for (const name of names) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    errors.push(`Invalid skill directory name: ${name}`);
  }
  const file = join(skillsDir, name, 'SKILL.md');
  const content = requireFile(file);
  if (content === null) continue;
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    errors.push(`${file}: expected YAML frontmatter at start`);
    continue;
  }
  const properties = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const property = line.match(/^([a-z-]+):\s*(.*?)\s*$/);
    if (!property) {
      errors.push(`${file}: unsupported frontmatter line (keep a simple key: value): ${line}`);
      continue;
    }
    if (properties.has(property[1])) errors.push(`${file}: duplicate ${property[1]} property`);
    properties.set(property[1], property[2].replace(/^(['"])(.*)\1$/, '$2'));
  }
  const declaredName = properties.get('name') ?? '';
  const description = properties.get('description') ?? '';
  if (declaredName !== name) errors.push(`${file}: frontmatter name must match directory ${name}`);
  if (!description || description.length > 1024) errors.push(`${file}: description must be 1–1024 characters`);
  if (!content.slice(match[0].length).trim()) errors.push(`${file}: missing skill instructions`);
  if (catalog && !catalog.includes(`.agents/skills/${name}/SKILL.md`)) {
    errors.push(`${catalogFile}: skill ${name} not listed with its SKILL.md link`);
  }
  checkLinks(file, content);
}
if (catalog) checkLinks(catalogFile, catalog);
if (agentInstructions) checkLinks(join(repo, 'AGENTS.md'), agentInstructions);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`Agent Skills validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}).`);
  process.exitCode = 1;
} else {
  console.log(`Agent Skills validation passed: ${names.length} skills, catalog and documentation links.`);
}
