"""Generate the rounded glass edge displacement texture using only Python's stdlib."""
import math
import struct
import zlib
from pathlib import Path

WIDTH, HEIGHT, RADIUS, EDGE = 256, 128, 32, 22
rows = []
for y in range(HEIGHT):
    row = bytearray([0])
    for x in range(WIDTH):
        dx, dy = x - WIDTH / 2, y - HEIGHT / 2
        qx, qy = abs(dx) - (WIDTH / 2 - RADIUS), abs(dy) - (HEIGHT / 2 - RADIUS)
        vx, vy = max(qx, 0), max(qy, 0)
        length = math.hypot(vx, vy)
        distance = length + min(max(qx, qy), 0) - RADIUS
        if length:
            nx, ny = vx / length, vy / length
        elif qx > qy:
            nx, ny = 1, 0
        else:
            nx, ny = 0, 1
        nx *= 1 if dx > 0 else -1
        ny *= 1 if dy > 0 else -1
        strength = math.sin(-distance / EDGE * math.pi) if -EDGE < distance < 0 else 0
        row.extend((round(128 - nx * 100 * strength), round(128 - ny * 100 * strength), 128, 255))
    rows.append(row)


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


output = Path(__file__).resolve().parent.parent / 'assets' / 'glass-displacement.png'
output.write_bytes(
    b'\x89PNG\r\n\x1a\n'
    + chunk(b'IHDR', struct.pack('>IIBBBBB', WIDTH, HEIGHT, 8, 6, 0, 0, 0))
    + chunk(b'IDAT', zlib.compress(b''.join(rows), 9))
    + chunk(b'IEND', b'')
)
print(f'Generated {output.name}: {WIDTH}x{HEIGHT}')
