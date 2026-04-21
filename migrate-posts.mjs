#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const POSTS = [
  'ada-awareness-without-the-fear-tactics-4552',
  'ai-chatbots-lead-conversion-4863',
  'ai-for-nonprofits-california-4694',
  'ai-grant-writing-nonprofits-california-4709',
  'behind-the-scenes-how-cc3pos-ai-village-writes-and-publishes-content-automatically-4961',
  'best-ai-tools-for-small-nonprofits-in-california-2026-guide-4716',
  'common-elementor-mistakes-we-fix-and-how-to-avoid-them-4575',
  'consultation-packages-quick-start-growth-momentum-4771',
  'echoes-they-left-behind-4761',
  'elementor-pro-what-it-actually-unlocks-and-when-its-worth-it-4477',
  'elementor-pro-without-breaking-your-site-a-calm-checklist-4566',
  'greater-lathrop-4672',
  'hosting-performance-4544',
  'how-ai-automation-is-transforming-small-business-operations-4960',
  'how-to-build-a-high-converting-landing-page-in-elementor-4834',
  'music-distribution-ai-creation-tools-for-artists-and-creators-4737',
  'rank-math-supercharged-content-ai-how-i-use-it-4460',
  'recommended-tools-for-wordpress-automation-development-4736',
  'shattered-reforged-with-companion-trauma-no-script-to-recovery-4607',
  'siteground-hosting-how-i-actually-use-it-4486',
  'the-connected-business-how-small-businesses-can-leverage-modern-wordpress-and-automation-in-2026-4948',
  'tools-we-trust-for-seo-4559',
  'trauma-no-script-to-recovery-4615',
  'website-care-4530',
  'website-security-4537',
  'who-am-i-4594',
  'wordpress-automation-for-small-businesses-stop-doing-everything-manually-4740',
  'wordpress-automation-hands-off-maintenance-4892',
  'wordpress-elementor-4522'
];

const CONTENT_DIR = './src/content/blog';

function detectCategory(slug) {
  if (slug.includes('wordpress') || slug.includes('elementor')) return 'WordPress';
  if (slug.includes('ai') || slug.includes('automation')) return 'AI & Automation';
  if (slug.includes('security')) return 'Security';
  if (slug.includes('accessib') || slug.includes('ada')) return 'Accessibility';
  if (slug.includes('hosting')) return 'Hosting';
  if (slug.includes('maintenance') || slug.includes('care')) return 'Maintenance';
  if (slug.includes('consultation')) return 'Consulting';
  if (slug.includes('nonprofit') || slug.includes('grant')) return 'Nonprofit';
  if (slug.includes('music')) return 'Music';
  return 'WordPress';
}

function extractDateFromSlug(slug) {
  const match = slug.match(/-(\d{4})$/);
  if (match) {
    const num = parseInt(match[1]);
    // These are post IDs, not actual dates. We'll use approximate dates based on order
    const baseDate = new Date('2026-04-01');
    baseDate.setDate(baseDate.getDate() - (5100 - num) * 0.5); // rough approximation
    return baseDate.toISOString().split('T')[0];
  }
  return '2026-04-01';
}

function htmlToMarkdown(html) {
  let md = html;
  
  // Convert paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');
  
  // Convert headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n\n');
  
  // Convert links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)');
  
  // Convert bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*');
  
  // Convert lists
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');
  
  // Convert line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove remaining tags
  md = md.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  
  return md;
}

function extractContent(html) {
  // Extract title
  const titleMatch = html.match(/<title>([^|]+)\s*\|/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
  
  // Extract description from meta
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const description = descMatch ? descMatch[1] : title;
  
  // Extract date from schema
  const dateMatch = html.match(/"datePublished":"([^"]+)"/);
  const pubDate = dateMatch ? dateMatch[1] : extractDateFromSlug(title);
  
  // Extract category from schema
  const catMatch = html.match(/"articleSection":"([^"]+)"/);
  const category = catMatch ? catMatch[1] : detectCategory(title);
  
  // Extract image
  const imgMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
  let heroImage = imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80';
  
  // Extract body content - get the article content
  const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  let bodyContent = '';
  
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
    // Remove navigation and footer elements
    bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    bodyContent = bodyContent.replace(/<div[^>]*class="cta[^>]*>[\s\S]*?<\/div>/gi, '');
    bodyContent = bodyContent.replace(/<a[^>]*back\s*to\s*blog[^>]*>[\s\S]*?<\/a>/gi, '');
    bodyContent = bodyContent.replace(/<img[^>]*>/gi, ''); // Remove inline images (hero is separate)
    
    bodyContent = htmlToMarkdown(bodyContent);
  }
  
  // If body is too short, use description
  if (bodyContent.length < 100) {
    bodyContent = `${description}\n\nExpert insights on ${title}. This article covers strategies for ${category} that help businesses grow.`;
  }
  
  return {
    title: title.replace(/\s+/g, ' ').trim(),
    description: description.replace(/\s+/g, ' ').trim(),
    pubDate,
    category,
    heroImage,
    bodyContent
  };
}

// Ensure content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

console.log(`Migrating ${POSTS.length} blog posts...`);

for (const slug of POSTS) {
  const remotePath = `/home/customer/www/insights.cc3po.com/public_html/${slug}/index.html`;
  const localPath = `./temp-posts/${slug}.html`;
  
  // Download via SSH
  console.log(`Downloading ${slug}...`);
  try {
    const cmd = `ssh -i ~/.ssh/ssh_cc3po_new -p 18765 u2050-jibaiylbxowl@ssh.cc3po.com "cat '${remotePath}'"`;
    const html = execSync(cmd, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
    
    // Extract content
    const content = extractContent(html);
    
    // Generate safe slug for filename
    const safeSlug = slug.replace(/-\d{4}$/, '').substring(0, 80);
    
    // Create markdown file
    const frontmatter = `---
title: '${content.title.replace(/'/g, "'")}' 
description: '${content.description.replace(/'/g, "'")}'
pubDate: '${content.pubDate}'
category: '${content.category}'
author: 'Carlos Cabrales'
authorUrl: 'https://www.linkedin.com/in/carloscabralesiiicc3po/'
heroImage: '${content.heroImage}'
---

`;

    const mdPath = path.join(CONTENT_DIR, `${safeSlug}.md`);
    fs.writeFileSync(mdPath, frontmatter + content.bodyContent);
    console.log(`  ✓ Created ${safeSlug}.md`);
    
  } catch (err) {
    console.error(`  ✗ Failed to process ${slug}:`, err.message);
  }
}

console.log('\nMigration complete!');
console.log(`Files created in: ${CONTENT_DIR}`);