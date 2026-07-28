#!/usr/bin/env python3
"""
Generate Android mipmap icons from the Carsai logo (1024x1024 PNG).
Replaces the Capacitor default icons with the app's custom logo.
"""

from PIL import Image
import os

LOGO_PATH = '/home/z/my-project/public/logo.png'
RES_DIR = '/home/z/my-project/android/app/src/main/res'

# Android mipmap sizes (density → size in pixels)
MIPMAP_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

# Foreground icons (for adaptive icon) — slightly smaller to fit in safe zone
FOREGROUND_SIZES = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

def generate_icons():
    logo = Image.open(LOGO_PATH).convert('RGBA')
    
    # Generate regular launcher icons
    for density, size in MIPMAP_SIZES.items():
        out_dir = os.path.join(RES_DIR, density)
        os.makedirs(out_dir, exist_ok=True)
        
        # Resize with high quality
        icon = logo.resize((size, size), Image.LANCZOS)
        icon_path = os.path.join(out_dir, 'ic_launcher.png')
        icon.save(icon_path, 'PNG')
        print(f'  Generated {icon_path} ({size}x{size})')
        
        # Round icon (same as regular for now — Android masks it)
        round_path = os.path.join(out_dir, 'ic_launcher_round.png')
        icon.save(round_path, 'PNG')
        print(f'  Generated {round_path} ({size}x{size})')
    
    # Generate foreground icons (for adaptive icon)
    for density, size in FOREGROUND_SIZES.items():
        out_dir = os.path.join(RES_DIR, density)
        os.makedirs(out_dir, exist_ok=True)
        
        # Create foreground with safe zone padding (logo takes ~70% of the canvas)
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        logo_size = int(size * 0.7)
        logo_resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
        offset = (size - logo_size) // 2
        canvas.paste(logo_resized, (offset, offset))
        
        fg_path = os.path.join(out_dir, 'ic_launcher_foreground.png')
        canvas.save(fg_path, 'PNG')
        print(f'  Generated {fg_path} ({size}x{size})')
    
    # Update ic_launcher_background color to match the app's primary color
    bg_path = os.path.join(RES_DIR, 'values', 'ic_launcher_background.xml')
    with open(bg_path, 'w') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n')
        f.write('<resources>\n')
        f.write('    <color name="ic_launcher_background">#FFFFFF</color>\n')
        f.write('</resources>\n')
    print(f'  Updated {bg_path}')

if __name__ == '__main__':
    print('Generating Android icons from logo.png...')
    generate_icons()
    print('Done!')
