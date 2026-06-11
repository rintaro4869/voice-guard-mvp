"""ひとり防犯ボイス アプリアイコン生成（盾＋スピーカー音波、フラット2色）"""
from PIL import Image, ImageDraw
import math

SIZE = 1024
SS = 4  # スーパーサンプリング倍率（輪郭を滑らかにする）
S = SIZE * SS
TEAL = (42, 157, 143)
WHITE = (255, 255, 255)

img = Image.new("RGB", (S, S), TEAL)
d = ImageDraw.Draw(img)


def q(p):
    return (p[0] * SS, p[1] * SS)


def quad_bezier(p0, p1, p2, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts

# 盾の輪郭（上辺は角丸、下は中央の尖りへ曲線）
cx = 512
top = 225
half = 290
side_bottom = 565
tip = (cx, 845)
r = 55  # 上角の丸み

outline = []
# 左上角丸
for i in range(31):
    a = math.pi + i / 30 * (math.pi / 2)
    outline.append((cx - half + r + r * math.cos(a), top + r + r * math.sin(a)))
# 右上角丸
for i in range(31):
    a = 1.5 * math.pi + i / 30 * (math.pi / 2)
    outline.append((cx + half - r + r * math.cos(a), top + r + r * math.sin(a)))
# 右辺 → 下端の尖りへ
outline.append((cx + half, side_bottom))
outline += quad_bezier((cx + half, side_bottom), (cx + half - 40, 750), tip)
# 下端 → 左辺へ（鏡映）
outline += quad_bezier(tip, (cx - half + 40, 750), (cx - half, side_bottom))

d.polygon([q(p) for p in outline], fill=WHITE)

# スピーカー本体（テール色で盾に重ねる）
gx = -28  # グリフ全体の水平調整
d.rounded_rectangle([q((392 + gx, 470)), q((452 + gx, 580))], radius=14 * SS, fill=TEAL)
d.polygon([q((452 + gx, 470)), q((548 + gx, 392)), q((548 + gx, 658)), q((452 + gx, 580))], fill=TEAL)

# 音波（2本の弧）
for radius, width in [(85, 30), (150, 30)]:
    cx_a, cy_a = 560 + gx, 525
    bbox = [q((cx_a - radius, cy_a - radius)), q((cx_a + radius, cy_a + radius))]
    d.arc([bbox[0][0], bbox[0][1], bbox[1][0], bbox[1][1]], start=-52, end=52, fill=TEAL, width=width * SS)

img = img.resize((SIZE, SIZE), Image.LANCZOS)
out = "/Users/yamadarintaro/Desktop/Claude Projects/VoiceGuard/ios/VoiceGuard/VoiceGuard/Assets.xcassets/AppIcon.appiconset/AppIcon1024.png"
img.save(out, "PNG")
print("saved:", out)
