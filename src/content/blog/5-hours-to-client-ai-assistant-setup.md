---
title: '5 Hours to Client: How We Set Up an AI Assistant for a Fitness Business'
description: 'A real case study — from first text to live AI assistant. Here''s exactly what happens when a local business owner needs AI, fast.'
pubDate: '2026-05-07'
category: 'AI & Automation'
author: 'Carlos Cabrales'
authorUrl: 'https://cc3po.com'
image: '/blog-images/ai-setup-case-study.jpg'
---

# 5 Hours to Client: How We Set Up an AI Assistant for a Fitness Business

Last Friday at 10:50 PM, I got a text: "I got another client."

The client was a fitness business owner — someone who runs a brand built on core values around faith, family, food, and fitness.

He needed an AI assistant. And he needed it fast.

Here's exactly what happened.

## 10:50 PM — The Text

> "I got another client. He wants an AI assistant set up. Get creative."

The challenge: set up a complete AI system for a new client within an hour. And the client was on his phone — no computer.

## 10:55 PM — The Setup

We spun up a cloud server, installed the AI platform, configured security, set up HTTPS, and branded the workspace for the client's business.

The AI already knew:
- The business name and brand
- The core philosophy and values
- The mission and tone
- What kind of content and communications to produce

## 11:15 PM — The Problems (And How We Solved Them)

We hit every issue you'd expect setting up a cloud AI system:

**Problem 1: Mobile browsers require HTTPS**
- Mobile browsers block connections on HTTP (not a "secure context")
- **Fix:** Set up nginx with an SSL certificate
- **Time:** 3 minutes

**Problem 2: Device pairing requires approval**
- Every dashboard refresh creates a new pairing request
- **Fix:** Switched to a Telegram bot as the primary access method
- **Lesson:** Always set up messaging FIRST, use dashboard as backup only

**Problem 3: API key missing on first chat**
- The AI couldn't respond without a provider key configured
- **Fix:** Added the AI provider key as an environment variable
- **Lesson:** Always configure the AI provider key BEFORE delivering to client

## 11:30 PM — The Messaging Bot

The browser dashboard wasn't working well on mobile. So we pivoted to what works: **a Telegram bot**.

Created a dedicated bot, connected it to the client's AI instance, and sent them the link.

They were chatting with their AI in 60 seconds.

## The Lesson

The entire setup — from text to live chat — took about an hour the first time.

With our documented SOP, it now takes **15 minutes**.

But here's the real lesson: **always ask if the client uses phone or computer.** We assumed desktop. The client was on their phone. That one question would have saved 30 minutes.

## What a Business AI Can Do

- Write content and marketing materials in your brand voice
- Create social media posts automatically
- Draft client communications and follow-ups
- Build product descriptions and sales pages
- Brainstorm business growth strategies
- Research competitors and market trends

And it already knows the brand voice: purpose-driven, structured, and aligned with the business's core values.

## What This Means for Your Business

If you're a business owner spending time on tasks an AI can handle, you're not running your business — your business is running you.

An AI assistant isn't a chatbot. It's a system that works 24/7, never calls in sick, and knows your brand inside and out.

[Set up your AI assistant →](https://offers.cc3po.com/get-started/)

---

*CC3PO — Build once. Run forever. Evolve continuously.*