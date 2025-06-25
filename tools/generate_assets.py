import os
import subprocess
from PIL import Image, ImageDraw, ImageOps
import time
import xml.etree.ElementTree as ET

def extract_svg_colors(svg_path):
    """Extract accent and mask background colors from SVG file."""
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    # Find the accent color
    accent_color = None
    mask_bg_color = None
    
    for gradient in root.findall('.//{http://www.w3.org/2000/svg}linearGradient'):
        gradient_id = gradient.get('id')
        stop = gradient.find('.//{http://www.w3.org/2000/svg}stop')
        if stop is not None:
            color = stop.get('stop-color')
            if gradient_id == 'accent':
                accent_color = color
            elif gradient_id == 'mask-background':
                mask_bg_color = color
    
    return accent_color, mask_bg_color

def run_inkscape_export(svg_path, output_path, width, height):
    """Run Inkscape to export SVG to PNG with specified dimensions."""
    inkscape_cmd = [
        'inkscape',
        '--export-filename=' + output_path,
        f'--export-width={width}',
        f'--export-height={height}',
        '--export-background-opacity=0',
        svg_path
    ]
    
    print(f"Running Inkscape command for {width}x{height}...")
    subprocess.run(inkscape_cmd, check=True)
    print("Inkscape command completed")
    
    # Wait for the temp PNG file to exist
    timeout = 10
    waited = 0
    while not os.path.exists(output_path) and waited < timeout:
        print(f"Waiting for temp file... ({waited:.1f}s)")
        time.sleep(0.5)
        waited += 0.5
        
    if not os.path.exists(output_path):
        raise Exception(f"Temp PNG file was not created after {timeout} seconds.")
        
    print(f"Temp file found at: {output_path}")

def create_bordered_icon(svg_path, size, border_width, background_color=None, grayscale=False):
    """Create an icon with a colored border and transparent center.
    
    Args:
        svg_path: Path to the SVG file
        size: Final size of the icon
        border_width: Width of the border
        background_color: Color of the background (None for transparent)
        grayscale: Whether to convert the final image to grayscale
    """
    # Extract colors from SVG
    accent_color, mask_bg_color = extract_svg_colors(svg_path)
    print(f"Extracted colors for {os.path.basename(svg_path)} - Accent: {accent_color}, Mask Background: {mask_bg_color}")
    
    # Determine border color based on mask background
    border_color = accent_color if mask_bg_color.lower() == 'white' else None
    print(f"Using border color: {border_color}")
    
    # Calculate dimensions
    center_size = size - (2 * border_width)
    x = border_width
    y = border_width
    
    # Create temporary PNG
    temp_png = os.path.join(os.path.dirname(svg_path), f'temp-{center_size}x{center_size}.png')
    run_inkscape_export(svg_path, temp_png, center_size, center_size)
    
    # Create base image with transparent background
    final_image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    svg_image = Image.open(temp_png).convert('RGBA')
    
    if border_color:
        print(f"Creating border rectangle with color: {border_color}")
        # Create a new image with transparent background
        border_rect = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        # Draw the border rectangle
        border_draw = ImageDraw.Draw(border_rect)
        border_draw.rectangle([(0, 0), (size, size)], fill=border_color)
        # Create a mask for the center
        mask = Image.new('L', (size, size), 255)  # Start with all white (opaque)
        mask_draw = ImageDraw.Draw(mask)
        # Use exact coordinates to avoid 1-pixel gaps
        mask_draw.rectangle([(x, y), (x + center_size - 1, y + center_size - 1)], fill=0)  # Make center black (transparent)
        # Apply the mask to keep the center transparent
        border_rect.putalpha(mask)
        final_image = border_rect
    
    # If we have a background color, create a background
    if background_color:
        bg_image = Image.new('RGBA', (size, size), background_color)
        final_image = Image.alpha_composite(bg_image, final_image)
    
    final_image.paste(svg_image, (x, y), svg_image)
    
    # Convert to grayscale if requested
    if grayscale:
        final_image = ImageOps.grayscale(final_image).convert('RGBA')
    
    # Close the SVG image to release the file handle
    svg_image.close()
    
    # Clean up temporary file
    try:
        os.remove(temp_png)
        print(f"Cleaned up temporary file: {temp_png}")
    except Exception as e:
        print(f"Warning: Could not remove temporary file {temp_png}: {e}")
    
    return final_image

def generate_assets():
    # Input and output paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    svg_path = os.path.join(project_root, 'assets', 'logo.svg')
    svg_inverse_path = os.path.join(project_root, 'assets', 'logo-inverse.svg')
    feature_graphic_svg = os.path.join(project_root, 'assets', 'feature-graphic.svg')
    output_dir = os.path.join(project_root, 'assets')
    
    # Define output paths
    icon_with_border = os.path.join(output_dir, 'icon-with-border-512.png')
    icon_with_border_large = os.path.join(output_dir, 'icon-with-border-1024.png')
    icon_with_border_inverse = os.path.join(output_dir, 'icon-with-border-inverse-1024.png')
    icon_with_border_grayscale = os.path.join(output_dir, 'icon-with-border-grayscale-1024.png')
    splash_icon = os.path.join(output_dir, 'splash-icon-1024.png')
    feature_graphic = os.path.join(output_dir, 'feature-graphic.png')
    
    print(f"Current directory: {current_dir}")
    print(f"Project root: {project_root}")
    print(f"SVG path: {svg_path}")
    print(f"Output directory: {output_dir}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Check if SVG files exist
    if not os.path.exists(svg_path):
        print(f"Error: SVG file not found at {svg_path}")
        return
    if not os.path.exists(svg_inverse_path):
        print(f"Error: Inverse SVG file not found at {svg_inverse_path}")
        return
    if not os.path.exists(feature_graphic_svg):
        print(f"Error: Feature graphic SVG file not found at {feature_graphic_svg}")
        return
    
    try:
        # Generate Play Store icon (512x512)
        print("\nGenerating Play Store icon...")
        final_image = create_bordered_icon(svg_path, 512, 30)
        final_image.save(icon_with_border, 'PNG')
        print(f"Generated icon with border at: {icon_with_border}")

        # Generate large icon (1024x1024)
        print("\nGenerating large icon...")
        final_image_large = create_bordered_icon(svg_path, 1024, 60)
        final_image_large.save(icon_with_border_large, 'PNG')
        print(f"Generated large icon with border at: {icon_with_border_large}")
        
        # Generate inverse icon (1024x1024)
        print("\nGenerating inverse icon...")
        final_image_inverse = create_bordered_icon(svg_inverse_path, 1024, 60)
        final_image_inverse.save(icon_with_border_inverse, 'PNG')
        print(f"Generated inverse icon with border at: {icon_with_border_inverse}")
        
        # Generate grayscale version with black background (1024x1024)
        print("\nGenerating grayscale icon...")
        final_image_grayscale = create_bordered_icon(svg_inverse_path, 1024, 60, 
                                                   background_color='black', grayscale=True)
        final_image_grayscale.save(icon_with_border_grayscale, 'PNG')
        print(f"Generated grayscale icon with border at: {icon_with_border_grayscale}")
        
        # Generate splash icon (1024x1024 with transparency)
        print("\nGenerating splash icon...")
        final_image_splash = create_bordered_icon(svg_inverse_path, 1024,80)
        final_image_splash.save(splash_icon, 'PNG')
        print(f"Generated splash icon at: {splash_icon}")
        
        # Generate feature graphic (1024x500)
        print("\nGenerating feature graphic...")
        run_inkscape_export(feature_graphic_svg, feature_graphic, 1024, 500)
        print(f"Generated feature graphic at: {feature_graphic}")
        
        # Verify the files were created
        for output_file in [icon_with_border, icon_with_border_large, icon_with_border_inverse, 
                          icon_with_border_grayscale, splash_icon, feature_graphic]:
            if os.path.exists(output_file):
                print(f"Final file size for {os.path.basename(output_file)}: {os.path.getsize(output_file)} bytes")
            else:
                print(f"Error: {os.path.basename(output_file)} was not created successfully")
            
    except subprocess.CalledProcessError as e:
        print(f"Error running Inkscape: {e}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == '__main__':
    generate_assets() 