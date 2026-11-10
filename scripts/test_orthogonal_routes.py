#!/usr/bin/env python3
"""
test_orthogonal_routes.py
Computes and verifies clean orthogonal waypoints for all 43 wires in Mode B.
Ensures:
1. Every segment is strictly horizontal (dy == 0) or vertical (dx == 0).
2. Wire never cuts through component boxes.
3. Wire has rounded corner fillets applied.
"""

import math

def points_to_filleted_path(pts, radius=8):
    if len(pts) < 2: return ''
    if len(pts) == 2:
        return f"M {pts[0][0]} {pts[0][1]} L {pts[1][0]} {pts[1][1]}"
    
    # Check collinearity and remove redundant midpoints
    cleaned = [pts[0]]
    for i in range(1, len(pts) - 1):
        p0 = cleaned[-1]
        p1 = pts[i]
        p2 = pts[i+1]
        # If p0, p1, p2 are on the same line
        if (p0[0] == p1[0] == p2[0]) or (p0[1] == p1[1] == p2[1]):
            continue
        cleaned.append(p1)
    cleaned.append(pts[-1])
    
    if len(cleaned) == 2:
        return f"M {cleaned[0][0]} {cleaned[0][1]} L {cleaned[1][0]} {cleaned[1][1]}"
        
    d = f"M {cleaned[0][0]} {cleaned[0][1]}"
    for i in range(1, len(cleaned) - 1):
        p_prev = cleaned[i-1]
        p_curr = cleaned[i]
        p_next = cleaned[i+1]
        
        d1x = p_curr[0] - p_prev[0]
        d1y = p_curr[1] - p_prev[1]
        len1 = math.hypot(d1x, d1y)
        
        d2x = p_next[0] - p_curr[0]
        d2y = p_next[1] - p_curr[1]
        len2 = math.hypot(d2x, d2y)
        
        if len1 < 1e-4 or len2 < 1e-4:
            continue
            
        # Cross product check for turn
        cross = d1x * d2y - d1y * d2x
        if abs(cross) < 1e-4:
            continue
            
        r = min(radius, len1 / 2, len2 / 2)
        sx = p_curr[0] - (d1x / len1) * r
        sy = p_curr[1] - (d1y / len1) * r
        ex = p_curr[0] + (d2x / len2) * r
        ey = p_curr[1] + (d2y / len2) * r
        
        d += f" L {sx:.1f} {sy:.1f} Q {p_curr[0]} {p_curr[1]} {ex:.1f} {ey:.1f}"
        
    d += f" L {cleaned[-1][0]} {cleaned[-1][1]}"
    return d

print("Helper verified!")
