import io
from typing import List, Tuple, Dict, Any, Optional
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import pytesseract


def normalize_image_mode(image: Image.Image) -> Image.Image:
    """Ensure image is in RGB mode with white background for any transparency."""
    if image.mode in ('RGBA', 'LA', 'P'):
        rgb_img = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        rgb_img.paste(image, mask=image.split()[-1] if 'A' in image.mode else None)
        return rgb_img
    elif image.mode != 'RGB':
        return image.convert('RGB')
    return image.copy()


def prepare_image_variants(file_bytes: bytes) -> List[Tuple[str, Image.Image]]:
    """
    Generate multiple non-destructive image preprocessing variants for OCR:
    1. original: unmodified RGB with transparent background flattened to white
    2. grayscale: clean luminance conversion
    3. scaled: LANCZOS upscaled if dimensions are small (<1200x600)
    4. autocontrast: normalized dynamic range
    5. mild_contrast: gentle 1.15x contrast enhancement (safe for thin fonts)
    6. adaptive_threshold: binarized for faint ink or photocopied documents
    """
    try:
        base = Image.open(io.BytesIO(file_bytes))
    except Exception:
        return []

    rgb_base = normalize_image_mode(base)
    variants: List[Tuple[str, Image.Image]] = [("original", rgb_base)]

    gray = rgb_base.convert('L')
    variants.append(("grayscale", gray))

    w, h = gray.size
    # Scaled variant for low-resolution screenshots / photos
    if w < 1200 or h < 600:
        scale = max(2, min(4, int(1600 / max(w, 1))))
        scaled = gray.resize((w * scale, h * scale), Image.Resampling.LANCZOS)
        variants.append(("scaled", scaled))

    # Normalized dynamic range
    try:
        autocontrast = ImageOps.autocontrast(gray)
        variants.append(("autocontrast", autocontrast))
    except Exception:
        pass

    # Gentle contrast (never 1.8x which distorts character glyphs)
    enhancer = ImageEnhance.Contrast(gray)
    mild_contrast = enhancer.enhance(1.15)
    variants.append(("mild_contrast", mild_contrast))

    # Adaptive binarization (Otsu-style via thresholding around median)
    try:
        # Calculate Otsu-like threshold or median
        hist = gray.histogram()
        total = sum(hist)
        cumsum = 0
        threshold = 128
        for i, count in enumerate(hist):
            cumsum += count
            if cumsum >= total // 2:
                threshold = i
                break
        thresh_img = gray.point(lambda p: 255 if p > threshold else 0)
        variants.append(("adaptive_threshold", thresh_img))
    except Exception:
        pass

    return variants


def extract_word_boxes_and_confidences(
    image: Image.Image,
    psm: int = 6
) -> Dict[str, Any]:
    """
    Extract word-level bounding boxes and confidence scores using Tesseract image_to_data.
    """
    try:
        data = pytesseract.image_to_data(
            image,
            config=f'--psm {psm}',
            output_type=pytesseract.Output.DICT
        )
        words = []
        confs = []
        for i in range(len(data.get('text', []))):
            txt = data['text'][i].strip()
            if not txt:
                continue
            conf_val = float(data['conf'][i]) if data['conf'][i] != '-1' else -1.0
            if conf_val >= 0:
                confs.append(conf_val)
            words.append({
                'text': txt,
                'left': data['left'][i],
                'top': data['top'][i],
                'width': data['width'][i],
                'height': data['height'][i],
                'confidence': conf_val
            })
        avg_conf = sum(confs) / len(confs) if confs else 0.0
        full_text = pytesseract.image_to_string(image, config=f'--psm {psm}').strip()
        return {
            'text': full_text,
            'words': words,
            'avg_confidence': avg_conf
        }
    except Exception as e:
        return {'text': '', 'words': [], 'avg_confidence': 0.0, 'error': str(e)}
