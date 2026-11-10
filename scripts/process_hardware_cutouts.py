import os
import sys
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

OUTPUT_DIR = 'public/assets/hardware'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_image(src_path, comp_id, tolerance=25, blur_radius=0.8, pad=6):
    """
    Cleans white/near-white studio background, creates smooth anti-aliased alpha,
    crops to bounding box with padding, and outputs both PNG and WebP.
    """
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return False
        
    print(f"Processing {comp_id} from {src_path}...")
    try:
        img = Image.open(src_path).convert('RGB')
        # If image is massive, scale down to max 1200px for speed and crisp web rendering
        max_dim = max(img.size)
        if max_dim > 1200:
            scale = 1200 / max_dim
            new_size = (int(img.size[0] * scale), int(img.size[1] * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
    except Exception as e:
        print(f"Error opening {src_path}: {e}")
        return False

    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape
    
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    # Check if pixel is near-white studio background
    is_white = (
        (r > 255 - tolerance) & 
        (g > 255 - tolerance) & 
        (b > 255 - tolerance) & 
        (np.maximum.reduce([np.abs(r - g), np.abs(g - b), np.abs(b - r)]) < 25)
    )
    
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()
    
    # Flood-fill seed from all 4 borders
    for x in range(w):
        if is_white[0, x]: q.append((0, x)); bg_mask[0, x] = True
        if is_white[h-1, x]: q.append((h-1, x)); bg_mask[h-1, x] = True
    for y in range(h):
        if is_white[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_white[y, w-1]: q.append((y, w-1)); bg_mask[y, w-1] = True
        
    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_mask[ny, nx] and is_white[ny, nx]:
                bg_mask[ny, nx] = True
                q.append((ny, nx))
                
    alpha = (~bg_mask).astype(np.uint8) * 255
    alpha_img = Image.fromarray(alpha, mode='L')
    if blur_radius > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    
    res = Image.new('RGBA', (w, h))
    res.paste(img, (0, 0))
    res.putalpha(alpha_img)
    
    bbox = res.getbbox()
    if bbox:
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        res = res.crop(bbox)
        
    out_png = os.path.join(OUTPUT_DIR, f"{comp_id}.png")
    out_webp = os.path.join(OUTPUT_DIR, f"{comp_id}.webp")
    
    res.save(out_png, 'PNG', optimize=True)
    res.save(out_webp, 'WEBP', quality=92)
    
    png_size = os.path.getsize(out_png) // 1024
    webp_size = os.path.getsize(out_webp) // 1024
    print(f"✓ {comp_id}: {res.size[0]}x{res.size[1]}px | PNG={png_size}KB, WebP={webp_size}KB")
    return True

if __name__ == '__main__':
    if len(sys.argv) > 2:
        src = sys.argv[1]
        cid = sys.argv[2]
        process_image(src, cid)
