# Changelog

The purpose of this file is to record all changes to the Gipity AI Dev Kit (ADK), including minor version updates, pull requests, and releases/tags.

## Relationship between CHANGELOG.md PROMPTLOG.md files
PROMPTLOG.md contains useful AI agent prompts to fix and enhance the Gipity AI Dev Kit (ADK). The prompts will include some used during changes logged below.

*Remember that AI agent prompts aren't exact, and re-running prompts is not guaranteed to provide the same results each time. You should verify they do what you require, and use them as a template to be modified for your own purposes if needed.*

---

## tag: [v1.0.0] — 9th September, 2025
- Initial open-source public version for the world

## tag: [v1.0.0-beta] — 14th August, 2025
- Allow/block access to production *.replit.app, based on new REPLIT_PROD_DOMAIN_ACCESS
- Improve standard repo management and instructional files
- Improve menu and navigation management
- Small UI changes for demo pages
- Bugfix: Android drawable resources must use underscores but had hypens, so fixed gipity-image-resizer.py
- SQL script for clients to remove the demo notes schema/table from DB
- Support additional master logo (inverted colour) and creation of all variants for web/pwa/native

---

## tag: [v1.0.0-alpha] — 5th August, 2025
- Initial release of the Gipity ADK
- Build native (iOS/Android), web and PWA apps with Replit Agent
- Supabase integrated for auth, data and file storage
- JWT-protected APIs, RLS, and dev/prod switching