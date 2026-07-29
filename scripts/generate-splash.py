#!/usr/bin/env python3
"""
Generate splash screen images for Android from the Carsai logo.
Places the logo centered on a solid red (#D32F2F) background.
"""

from PIL import Image
import os

# Android splash screen dimensions (portrait + landscape)
SPLASH_SIZES = {
    "drawable-port-mdpi":     (320, 480),
    "drawable-port-hdpi":     (480, 800),
    "drawable-port-xhdpi":   (640, 960),
    "drawable-port-xxhdpi":  (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi":    (480, 320),
    "drawable-land-hdpi":    (800, 480),
    "drawable-land-xhdpi":   (960, 640),
    "drawable-land-xxhdpi":  (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

# Also create the default drawable
SPLASH_SIZES["drawable"] = (480, 320)

# Background color: Carsai blue (logo is red, so blue provides contrast)
BG_COLOR = (21, 101, 192)  # #1565C0

# Path to the logo
LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "logo.png")
ANDROID_RES = os.path.join(os.path.dirname(__file__), "..", "android", "app", "src", "main", "res")

def generate_splash():
    logo = Image.open(LOGO_PATH).convert("RGBA")

    for folder, (width, height) in SPLASH_SIZES.items():
        # Create background
        splash = Image.new("RGBA", (width, height), BG_COLOR + (255,))

        # Calculate logo size: ~40% of the smaller dimension for portrait,
        # ~35% for landscape
        is_portrait = height > width
        scale = 0.40 if is_portrait else 0.35
        logo_size = int(min(width, height) * scale)

        # Resize logo maintaining aspect ratio
        logo_ratio = logo.size[0] / logo.size[1]  # width / height
        logo_w = int(logo_size * logo_ratio) if logo_ratio != 1 else logo_size
        logo_h = logo_size
        logo_resized = logo.resize((logo_w, logo_h), Image.LANCZOS)

        # Center the logo
        x = (width - logo_w) // 2
        y = (height - logo_h) // 2

        # Paste logo onto background
        splash.paste(logo_resized, (x, y), logo_resized)

        # Convert to RGB (no alpha needed for splash)
        splash = splash.convert("RGB")

        # Save
        out_dir = os.path.join(ANDROID_RES, folder)
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "splash.png")
        splash.save(out_path, "PNG", optimize=True)
        print(f"  Generated: {folder}/splash.png ({width}x{height})")

    print(f"\n✅ All splash images generated!")

if __name__ == "__main__":
    generate_splash()
