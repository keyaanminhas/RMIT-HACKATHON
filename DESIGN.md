---
name: NeutralVault
description: Institutional consortium intelligence workspace
colors:
  forest: "#0b3b2e"
  forest-hover: "#07281f"
  forest-subtle: "#eaf1ee"
  ink: "#17221e"
  muted: "#59645d"
  paper: "#f6f7f5"
  line: "#e2e5df"
  warm: "#f4f0e8"
  warm-ink: "#69563b"
  danger: "#991b1b"
  danger-bg: "#fef2f2"
  warning: "#80540f"
  warning-bg: "#fff8e8"
  white: "#ffffff"
typography:
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    lineHeight: 1.7
    letterSpacing: "-0.01em"
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
rounded:
  control: "8px"
  navigation: "10px"
  panel: "12px"
spacing:
  tight: "8px"
  small: "12px"
  medium: "16px"
  group: "24px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "23px"
---

# Design System: NeutralVault

## Overview

The final supplied consortium HTML is visual authority. Its restrained institutional workspace combines forest actions, pale paper surroundings, compact navigation and clear report tables. Product capability and permission states are part of the interface, not decorative proof.

## Colors

Forest marks primary actions and selected navigation. Pale forest signals configured or successful states. Warm paper and brown text carry setup notices and the synthetic-data label. Use restrained red for rejected or failed actions and amber for pending decisions.

## Typography

Self-host Plus Jakarta Sans for headings, Inter for interface text and JetBrains Mono for identifiers, ciphertext and hashes. Headings use 30px desktop and 25px mobile. Body copy uses 13–14px; dense table and control labels use 11–12px. Data uses tabular numerals. Avoid decorative monospace in prose.

## Layout

A fixed 256px sidebar and 65px utility bar frame the desktop workspace. Content has 32px horizontal padding and a maximum width of 1340px. Report/check screens use a 2:1 main-and-helper split. Metric rows use four columns, then two below 1200px. Below 950px split panels stack. Below 700px the sidebar becomes a dismissible drawer and page padding becomes 16px. Tables scroll inside their containers.

## Elevation & Depth

Panels are flat white surfaces with thin borders. Tone, spacing and dividers establish hierarchy; no decorative shadows or glowing proof badges are used. The mobile drawer overlays a translucent forest scrim.

## Shapes

Panels use 12px corners, navigation 10px and controls 8px. Small statuses and organisation decisions use pill badges. Form fields remain recognisable native controls.

## Components

- **Navigation:** numbered, descriptive vertical buttons with pale-forest selection and a real-session summary. No identity switcher.
- **Buttons:** forest primary actions, bordered secondary actions, red unauthorised-test actions. Disabled controls pair with a nearby explanation.
- **Inputs:** white background, thin neutral stroke, forest caret and visible focus ring. Labels stay visible above fields.
- **Panels:** shared heading/body structure, 18–23px body padding, clear empty/loading/error states.
- **Statuses:** state comes from actual configuration or recorded responses. Setup-required badges never imply successful enforcement.
- **Tables:** muted uppercase column headers, compact rows, fine dividers and explicit encrypted metadata labels.

## Do's and Don'ts

- Do retain the final reference's forest/paper visual system and compact task hierarchy.
- Do show actual organisations, roles, counts, policy readiness and operation results.
- Do provide visible focus, reduced-motion support and mobile overflow containment.
- Don't reintroduce the previous ZIP visual designs or FairEnrol branding.
- Don't fabricate ciphertext previews, telemetry, approval proofs or online security claims.
