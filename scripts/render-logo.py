from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
SIZE = 512


def interpolate(start, end, ratio):
    return tuple(round(start[i] + (end[i] - start[i]) * ratio) for i in range(3))


def apply_gradient_line(image, start, end, colors, width):
    mask = Image.new("L", image.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.line((*start, *end), fill=255, width=width)
    radius = width // 2
    for x, y in (start, end):
        mask_draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=255)

    gradient = Image.new("RGBA", image.size)
    pixels = gradient.load()
    dx, dy = end[0] - start[0], end[1] - start[1]
    denominator = max(1, dx * dx + dy * dy)
    segments = len(colors) - 1
    for y in range(image.height):
        for x in range(image.width):
            ratio = max(0, min(1, ((x - start[0]) * dx + (y - start[1]) * dy) / denominator))
            color_position = min(segments - 1, int(ratio * segments))
            local_ratio = ratio * segments - color_position
            pixels[x, y] = (*interpolate(colors[color_position], colors[color_position + 1], local_ratio), 255)
    transparent = Image.new("RGBA", image.size, (0, 0, 0, 0))
    image.alpha_composite(Image.composite(gradient, transparent, mask))


def build_square(size=SIZE):
    scale = size / SIZE
    image = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)

    def box(values):
        return tuple(round(value * scale) for value in values)

    draw.rounded_rectangle(box((20, 20, 492, 492)), radius=round(142 * scale), fill="#f7fbff", outline="#b9cfdf", width=max(1, round(14 * scale)))
    cyan = (8, 191, 232)
    violet = (116, 103, 232)
    orange = (242, 138, 52)
    navy = (23, 48, 77)
    width = max(3, round(58 * scale))
    apply_gradient_line(image, box((112, 148)), box((252, 292)), [cyan, violet], width)
    apply_gradient_line(image, box((252, 292)), box((400, 112)), [violet, orange], width)
    draw.line((*box((252, 292)), *box((252, 404))), fill=navy, width=width)
    cap = width // 2
    for x, y, color in ((112, 148, cyan), (252, 292, violet), (252, 404, navy), (400, 112, orange)):
        px, py = box((x, y))
        draw.ellipse((px - cap, py - cap, px + cap, py + cap), fill=color)
    return image


def build_social():
    image = Image.new("RGB", (1200, 630), "#07101b")
    draw = ImageDraw.Draw(image)
    draw.ellipse((-160, -250, 540, 450), fill="#0d4d6a")
    draw.ellipse((820, 160, 1450, 790), fill="#48285d")
    mark = build_square(330)
    image.paste(mark, (96, 150), mark)
    font_root = Path("C:/Windows/Fonts")
    title_font = ImageFont.truetype(str(font_root / "segoeuib.ttf"), 76)
    subtitle_font = ImageFont.truetype(str(font_root / "segoeui.ttf"), 31)
    markets_font = ImageFont.truetype(str(font_root / "segoeuib.ttf"), 24)
    draw.text((480, 190), "YADETOUT", fill="#f2f7fc", font=title_font)
    draw.text((484, 288), "Analyse des marchés financiers", fill="#9db0c4", font=subtitle_font)
    draw.line((482, 334, 1070, 334), fill="#29445f", width=2)
    draw.text((484, 370), "Forex  •  Métaux  •  Actions  •  Indices  •  ETF", fill="#d9e5ef", font=markets_font)
    return image


square = build_square()
square.convert("RGB").save(ROOT / "logo-512.png", format="PNG", optimize=True)
build_square(192).save(ROOT / "icon-192.png", format="PNG", optimize=True)
build_square(180).save(ROOT / "apple-touch-icon.png", format="PNG", optimize=True)
build_square(48).save(ROOT / "favicon-48.png", format="PNG", optimize=True)
square.save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
build_social().save(ROOT / "og-yadetout.png", format="PNG", optimize=True)
