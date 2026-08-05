from PIL import Image, ImageDraw

SIZE = 512
image = Image.new("RGB", (SIZE, SIZE), "#ffffff")
draw = ImageDraw.Draw(image)

draw.rounded_rectangle((16, 16, 496, 496), radius=128, fill="#0b1827", outline="#31506f", width=16)

points = [(92, 354), (196, 218), (276, 290), (420, 104)]
colors = ["#37d8ff", "#9d75ff", "#ffad55"]
for index in range(len(points) - 1):
    draw.line((points[index], points[index + 1]), fill=colors[index], width=42, joint="curve")
for point, color in zip(points, [colors[0], colors[1], colors[1], colors[2]]):
    x, y = point
    draw.ellipse((x - 21, y - 21, x + 21, y + 21), fill=color)

draw.ellipse((396, 80, 444, 128), fill="#ffad55")
image.save("logo-512.png", format="PNG", optimize=True)
