# Button Styling System

This document describes the modular button styling system for the Supply Sergeant application.

## Overview

The application uses a modular approach to button styling with:

1. Global CSS variables in `Theme.css` for theming
2. Reusable button classes in `Buttons.css` 
3. Context-specific styling in component CSS files

## Button Classes

The main button classes are:

- `.btn` - Base button class with common properties
- `.btn-primary` - Primary action buttons (dark gray: #282c34)
- `.btn-secondary` - Secondary action buttons (medium gray: #6c778d)
- `.btn-danger` - Dangerous actions like delete (red)
- `.btn-success` - Success actions (green)
- `.btn-warning` - Warning actions (orange/yellow)

Modifiers:
- `.btn-sm` - Small button
- `.btn-lg` - Large button
- `.btn-block` - Full-width button

## Usage

To apply these styles, import `Buttons.css` and use the appropriate classes:

```html
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary btn-sm">Small Secondary Action</button>
```

## Legacy Classes

For backward compatibility, we maintain original class names such as:
- `.primary-button` - Maps to primary action styling
- `.secondary-button` - Maps to secondary action styling
- `.nav-button` - App navigation buttons

These legacy classes have been updated to use the new color scheme but retain their original class names.

## Color Scheme

The application uses a consistent color scheme for buttons:
- Selected/active state: #282c34 (dark gray)
- Inactive/secondary state: #6c778d (medium gray)
- Hover states use slightly darker variations of these colors 