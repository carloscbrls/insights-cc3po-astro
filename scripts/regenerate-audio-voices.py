#!/usr/bin/env python3
"""Regenerate audio narrations with correct agent voices."""

import subprocess, os, re, glob

BLOG_DIR = "src/content/blog"
AUDIO_DIR = "public/audio"

# Agent voice mapping
VOICE_MAP = {
    "atlas": "en-US-AndrewNeural",       # Warm, Confident, Authentic — carries weight
    "sentinel": "en-US-ChristopherNeural", # Reliable, Authority — protective guardian
    "aegis": "en-US-EricNeural",          # Rational — advocacy-focused
    "forge": "en-US-BrianNeural",         # Approachable, Casual, Sincere — builder
    "weaver": "en-US-EmmaNeural",         # Cheerful, Clear, Conversational — storyteller
    "miles": "en-US-GuyNeural",           # Passion — creative, artistic
    "sage": "en-US-AvaNeural",            # Expressive, Caring — learning & innovation
    "leo": "en-US-JennyNeural",           # Friendly, Considerate — conversational
    "anchor": "en-US-SteffanNeural",      # Rational — steady support
    "spark": "en-US-MichelleNeural",      # Friendly, Pleasant — energetic
    "compass": "en-US-AndrewNeural",      # Atlas's old name, use Atlas voice
    "unknown": "en-US-AndrewNeural",      # Default to Atlas
}

# Agent emoji mapping
EMOJI_MAP = {
    "atlas": "🌍",
    "sentinel": "🛡️",
    "aegis": "♿",
    "forge": "⚒️",
    "weaver": "🕸️",
    "miles": "🎵",
    "sage": "🌿",
    "leo": "🦁",
    "anchor": "⚓",
    "spark": "✨",
    "compass": "🌍",
    "unknown": "🌍",
}

def get_blog_content(filepath):
    """Extract title and body text from blog post."""
    with open(filepath) as f:
        content = f.read()
    
    # Extract frontmatter
    if not content.startswith('---'):
        return None, None, None
    
    end = content.find('---', 3)
    if end == -1:
        return None, None, None
    
    frontmatter = content[3:end]
    body = content[end+3:].strip()
    
    # Get author
    author_match = re.search(r"^author:\s*['\"]?(\w+)['\"]?", frontmatter, re.MULTILINE)
    author = author_match.group(1) if author_match else "unknown"
    
    # Get title
    title_match = re.search(r"^title:\s*['\"](.+?)['\"]", frontmatter, re.MULTILINE)
    title = title_match.group(1) if title_match else ""
    
    # Clean body text for TTS (remove markdown, HTML, etc.)
    clean = re.sub(r'!\[.*?\]\(.*?\)', '', body)  # images
    clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean)  # links
    clean = re.sub(r'^#{1,6}\s+', '', clean, flags=re.MULTILINE)  # headers
    clean = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean)  # bold
    clean = re.sub(r'\*([^*]+)\*', r'\1', clean)  # italic
    clean = re.sub(r'`([^`]+)`', r'\1', clean)  # inline code
    clean = re.sub(r'^\s*[-*]\s+', '', clean, flags=re.MULTILINE)  # list items
    clean = re.sub(r'^\s*\d+\.\s+', '', clean, flags=re.MULTILINE)  # numbered lists
    clean = re.sub(r'\n{3,}', '\n\n', clean)  # excessive newlines
    clean = clean.strip()
    
    # Truncate to ~5000 chars for TTS (about 5 minutes of audio)
    if len(clean) > 5000:
        # Find last sentence boundary
        cutoff = clean[:5000].rfind('.')
        if cutoff > 4000:
            clean = clean[:cutoff+1]
    
    return author, title, clean

def generate_audio(slug, author, text):
    """Generate audio with the correct agent voice."""
    voice = VOICE_MAP.get(author, VOICE_MAP["atlas"])
    emoji = EMOJI_MAP.get(author, "🌍")
    output_file = f"{AUDIO_DIR}/{author}-{slug}.mp3"
    
    # Check if file already exists with correct voice
    if os.path.exists(output_file):
        print(f"  ✅ Already exists: {author}-{slug}.mp3")
        return output_file
    
    # Generate new audio
    cmd = [
        "edge-tts",
        "--voice", voice,
        "--text", text,
        "--write-media", output_file
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            print(f"  🎙️ Generated: {author}-{slug}.mp3 ({emoji} {author})")
            return output_file
        else:
            print(f"  ❌ Failed: {slug} — {result.stderr[:100]}")
            return None
    except subprocess.TimeoutExpired:
        print(f"  ⏱️ Timeout: {slug}")
        return None
    except Exception as e:
        print(f"  ❌ Error: {slug} — {e}")
        return None

def update_frontmatter(filepath, audio_path, author):
    """Update the audio and audioTitle fields in frontmatter."""
    emoji = EMOJI_MAP.get(author, "🌍")
    agent_name = author.capitalize()
    if author == "compass":
        agent_name = "Atlas"
        emoji = "🌍"
    
    audio_line = f"audio: '{audio_path}'"
    audio_title_line = f"audioTitle: 'Listen to {agent_name} {emoji} narrate this article'"
    
    with open(filepath) as f:
        content = f.read()
    
    # Update audio line
    content = re.sub(r"^audio:.*$", audio_line, content, flags=re.MULTILINE)
    # Update audioTitle line
    content = re.sub(r"^audioTitle:.*$", audio_title_line, content, flags=re.MULTILINE)
    
    with open(filepath, 'w') as f:
        f.write(content)

# Main
print("🎙️ Regenerating audio with correct agent voices...\n")

regenerated = 0
skipped = 0

for filepath in sorted(glob.glob(f"{BLOG_DIR}/*.md")):
    slug = os.path.basename(filepath).replace('.md', '')
    author, title, text = get_blog_content(filepath)
    
    if not text or not author:
        print(f"  ⏭️ Skipping: {slug} (no content or author)")
        skipped += 1
        continue
    
    # Check if current audio matches author
    audio_match = re.search(r"^audio:\s*['\"](.+?)['\"]", 
                           open(filepath).read(), re.MULTILINE)
    if audio_match:
        current_audio = audio_match.group(1)
        current_voice = os.path.basename(current_audio).split('-')[0]
        expected_voice = author if author != "compass" else "atlas"
        
        if current_voice == expected_voice and os.path.exists(f"public{current_audio}"):
            # Already correct
            skipped += 1
            continue
    
    # Generate with correct voice
    result = generate_audio(slug, author, text)
    if result:
        # Update frontmatter
        audio_path = f"/audio/{author}-{slug}.mp3"
        update_frontmatter(filepath, audio_path, author)
        regenerated += 1
    
    # Rate limit
    import time
    time.sleep(0.5)

print(f"\n✅ Done! Regenerated: {regenerated}, Skipped: {skipped}")