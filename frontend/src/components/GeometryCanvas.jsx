import React, { useRef, useState } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Circle as KonvaCircle, Rect } from 'react-konva';
import { Pencil, Square, Circle, Eraser, Type, Wand2, Trash2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const GeometryCanvas = ({ onSolveCanvas }) => {
    const theme = useTheme();
    const stageRef = useRef(null);
    const [tool, setTool] = useState('pen'); // pen, eraser, text, rect, circle
    const [color, setColor] = useState('#1f2937'); // active color
    const [lines, setLines] = useState([]);
    const [shapes, setShapes] = useState([]); // { type: 'rect'|'circle', x, y, w, h, r, color }
    const [texts, setTexts] = useState([]); // { x, y, text, color }
    const [isDrawing, setIsDrawing] = useState(false);
    
    // simple state for handling text input dialog
    const [textInputPos, setTextInputPos] = useState(null);
    const [currentText, setCurrentText] = useState('');

    const handleMouseDown = (e) => {
        // If an input is currently active, clicking anywhere should just let it blur
        if (textInputPos) {
            return;
        }

        if (tool === 'text') {
            const pos = e.target.getStage().getPointerPosition();
            setTextInputPos(pos);
            setCurrentText('');
            return;
        }

        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        if (tool === 'pen' || tool === 'eraser') {
            setLines([...lines, { tool, color: tool === 'eraser' ? 'white' : color, points: [pos.x, pos.y] }]);
        } else if (tool === 'rect') {
            setShapes([...shapes, { type: 'rect', color, x: pos.x, y: pos.y, width: 0, height: 0 }]);
        } else if (tool === 'circle') {
            setShapes([...shapes, { type: 'circle', color, x: pos.x, y: pos.y, radius: 0 }]);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (tool === 'pen' || tool === 'eraser') {
            let lastLine = lines[lines.length - 1];
            lastLine.points = lastLine.points.concat([point.x, point.y]);
            lines.splice(lines.length - 1, 1, lastLine);
            setLines(lines.concat());
        } else if (tool === 'rect') {
            let lastShape = shapes[shapes.length - 1];
            lastShape.width = point.x - lastShape.x;
            lastShape.height = point.y - lastShape.y;
            shapes.splice(shapes.length - 1, 1, lastShape);
            setShapes(shapes.concat());
        } else if (tool === 'circle') {
            let lastShape = shapes[shapes.length - 1];
            lastShape.radius = Math.sqrt(Math.pow(point.x - lastShape.x, 2) + Math.pow(point.y - lastShape.y, 2));
            shapes.splice(shapes.length - 1, 1, lastShape);
            setShapes(shapes.concat());
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleSolve = () => {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.9 });
        onSolveCanvas(uri);
    };

    const handleTextBlur = () => {
        if (currentText.trim() && textInputPos) {
            setTexts(prev => [...prev, { x: textInputPos.x, y: textInputPos.y, text: currentText, color }]);
        }
        setTextInputPos(null);
    };

    const handleTextSubmit = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // This will trigger handleTextBlur
        }
    };

    const handleBeautify = () => {
        const GRID_SIZE = 20;
        
        // 1. Snap existing rects/circles to grid
        const newShapes = shapes.map(s => {
            if (s.type === 'rect') {
                let w = s.width;
                let h = s.height;
                // If it's roughly a square, make it perfect
                if (Math.abs(Math.abs(w) - Math.abs(h)) < Math.max(Math.abs(w), Math.abs(h)) * 0.2) {
                    const size = Math.max(Math.abs(w), Math.abs(h));
                    w = size * Math.sign(w);
                    h = size * Math.sign(h);
                }
                return { 
                    ...s, 
                    x: Math.round(s.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(s.y / GRID_SIZE) * GRID_SIZE,
                    width: Math.round(w / GRID_SIZE) * GRID_SIZE, 
                    height: Math.round(h / GRID_SIZE) * GRID_SIZE 
                };
            }
            if (s.type === 'circle') {
                return {
                    ...s,
                    x: Math.round(s.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(s.y / GRID_SIZE) * GRID_SIZE,
                    radius: Math.round(s.radius / GRID_SIZE) * GRID_SIZE
                };
            }
            if (s.type === 'polygon') {
                return {
                    ...s,
                    points: s.points.map(p => Math.round(p / GRID_SIZE) * GRID_SIZE)
                };
            }
            return s;
        });

        // 2. Shape Recognition for Pen Strokes
        const penLines = lines.filter(line => line.tool === 'pen' && line.points.length > 4);
        
        // Calculate BBox for each line
        const linesWithBBox = penLines.map(line => {
            const pts = line.points;
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            let length = 0;
            for (let i = 0; i < pts.length; i += 2) {
                if (pts[i] < minX) minX = pts[i];
                if (pts[i] > maxX) maxX = pts[i];
                if (pts[i+1] < minY) minY = pts[i+1];
                if (pts[i+1] > maxY) maxY = pts[i+1];
                if (i > 0) length += Math.hypot(pts[i] - pts[i-2], pts[i+1] - pts[i-1]);
            }
            return { line, minX, maxX, minY, maxY, length };
        });

        // Group intersecting/nearby lines
        const groups = [];
        linesWithBBox.forEach(item => {
            let foundGroup = null;
            for (const g of groups) {
                if (item.minX <= g.maxX + 30 && item.maxX >= g.minX - 30 &&
                    item.minY <= g.maxY + 30 && item.maxY >= g.minY - 30) {
                    foundGroup = g;
                    break;
                }
            }
            if (foundGroup) {
                foundGroup.lines.push(item);
                foundGroup.minX = Math.min(foundGroup.minX, item.minX);
                foundGroup.maxX = Math.max(foundGroup.maxX, item.maxX);
                foundGroup.minY = Math.min(foundGroup.minY, item.minY);
                foundGroup.maxY = Math.max(foundGroup.maxY, item.maxY);
                foundGroup.length += item.length;
            } else {
                groups.push({
                    lines: [item],
                    minX: item.minX, maxX: item.maxX,
                    minY: item.minY, maxY: item.maxY,
                    length: item.length
                });
            }
        });

        let newShapesFromPens = [];
        let remainingLines = [];

        groups.forEach(g => {
            const w = g.maxX - g.minX;
            const h = g.maxY - g.minY;
            if (w < 20 || h < 20) {
                g.lines.forEach(item => remainingLines.push(item.line));
                return;
            }

            const centerX = g.minX + w/2;
            const centerY = g.minY + h/2;
            let avgDistToCenter = 0;
            let ptsCount = 0;
            let isRectEdge = true;
            
            let minXPt = [Infinity, 0], maxXPt = [-Infinity, 0];
            let minYPt = [0, Infinity], maxYPt = [0, -Infinity];
            const allPts = [];

            g.lines.forEach(item => {
                const pts = item.line.points;
                for (let i = 0; i < pts.length; i += 2) {
                    const px = pts[i], py = pts[i+1];
                    allPts.push({x: px, y: py});
                    
                    avgDistToCenter += Math.hypot(px - centerX, py - centerY);
                    ptsCount++;
                    
                    const minDistToEdge = Math.min(
                        Math.abs(px - g.minX), Math.abs(px - g.maxX),
                        Math.abs(py - g.minY), Math.abs(py - g.maxY)
                    );
                    if (minDistToEdge > Math.max(w, h) * 0.25) { 
                        isRectEdge = false; 
                    }

                    if (px < minXPt[0]) minXPt = [px, py];
                    if (px > maxXPt[0]) maxXPt = [px, py];
                    if (py < minYPt[1]) minYPt = [px, py];
                    if (py > maxYPt[1]) maxYPt = [px, py];
                }
            });
            
            avgDistToCenter /= ptsCount;
            const expectedRadius = Math.max(w, h) / 2;
            const isCircle = Math.abs(avgDistToCenter - expectedRadius) < expectedRadius * 0.2;
            
            const rectPerimeter = 2 * (w + h);
            const circlePerimeter = Math.PI * Math.max(w, h);

            // Check Circle
            if (isCircle && g.length > circlePerimeter * 0.7 && g.length < circlePerimeter * 1.5) {
                newShapesFromPens.push({ type: 'circle', color: g.lines[0].line.color, x: centerX, y: centerY, radius: expectedRadius });
                return;
            } 
            
            // Check Rectangle
            if (isRectEdge && g.length > rectPerimeter * 0.7 && g.length < rectPerimeter * 1.5) {
                let rectW = w;
                let rectH = h;
                if (Math.abs(w - h) < Math.max(w, h) * 0.2) {
                    rectW = Math.max(w, h);
                    rectH = rectW;
                }
                newShapesFromPens.push({ type: 'rect', color: g.lines[0].line.color, x: g.minX, y: g.minY, width: rectW, height: rectH });
                return;
            }

            // Check Triangle
            const corners = [minXPt, maxXPt, minYPt, maxYPt];
            const uniqueCorners = [];
            corners.forEach(c => {
                if (!uniqueCorners.some(uc => uc[0] === c[0] && uc[1] === c[1])) {
                    uniqueCorners.push(c);
                }
            });

            if (uniqueCorners.length >= 3) {
                let maxArea = 0;
                let bestTri = null;
                for(let i=0; i<uniqueCorners.length-2; i++) {
                    for(let j=i+1; j<uniqueCorners.length-1; j++) {
                        for(let k=j+1; k<uniqueCorners.length; k++) {
                            const p1 = uniqueCorners[i], p2 = uniqueCorners[j], p3 = uniqueCorners[k];
                            const area = 0.5 * Math.abs(p1[0]*(p2[1]-p3[1]) + p2[0]*(p3[1]-p1[1]) + p3[0]*(p1[1]-p2[1]));
                            if (area > maxArea) {
                                maxArea = area;
                                bestTri = [p1, p2, p3];
                            }
                        }
                    }
                }

                if (bestTri && maxArea > (w*h)*0.2) {
                    const distToSegment = (px, py, x1, y1, x2, y2) => {
                        const l2 = (x1 - x2)**2 + (y1 - y2)**2;
                        if (l2 === 0) return Math.hypot(px - x1, py - y1);
                        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
                        t = Math.max(0, Math.min(1, t));
                        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
                    };

                    let isTriangleEdge = true;
                    for (const pt of allPts) {
                        const d1 = distToSegment(pt.x, pt.y, bestTri[0][0], bestTri[0][1], bestTri[1][0], bestTri[1][1]);
                        const d2 = distToSegment(pt.x, pt.y, bestTri[1][0], bestTri[1][1], bestTri[2][0], bestTri[2][1]);
                        const d3 = distToSegment(pt.x, pt.y, bestTri[2][0], bestTri[2][1], bestTri[0][0], bestTri[0][1]);
                        if (Math.min(d1, d2, d3) > Math.max(w, h) * 0.25) {
                            isTriangleEdge = false;
                            break;
                        }
                    }
                    
                    const triPerimeter = Math.hypot(bestTri[0][0]-bestTri[1][0], bestTri[0][1]-bestTri[1][1]) +
                                         Math.hypot(bestTri[1][0]-bestTri[2][0], bestTri[1][1]-bestTri[2][1]) +
                                         Math.hypot(bestTri[2][0]-bestTri[0][0], bestTri[2][1]-bestTri[0][1]);

                    if (isTriangleEdge && g.length > triPerimeter * 0.7 && g.length < triPerimeter * 1.5) {
                        const snappedTri = bestTri.map(p => [
                            Math.round(p[0] / GRID_SIZE) * GRID_SIZE,
                            Math.round(p[1] / GRID_SIZE) * GRID_SIZE
                        ]);
                        newShapesFromPens.push({ 
                            type: 'polygon', 
                            color: g.lines[0].line.color, 
                            points: [snappedTri[0][0], snappedTri[0][1], snappedTri[1][0], snappedTri[1][1], snappedTri[2][0], snappedTri[2][1]] 
                        });
                        return;
                    }
                }
            }
            
            // Keep original if nothing matched
            g.lines.forEach(item => remainingLines.push(item.line));
        });

        // Add back non-pen lines or small lines
        lines.forEach(line => {
            if (line.tool !== 'pen' || line.points.length <= 4) {
                remainingLines.push(line);
            }
        });

        // 3. Smooth individual remaining pen lines if horizontal/vertical
        const finalLines = remainingLines.map(line => {
            if (line.tool === 'pen' && line.points.length > 4) {
                const points = line.points;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for (let i = 0; i < points.length; i += 2) {
                    if (points[i] < minX) minX = points[i];
                    if (points[i] > maxX) maxX = points[i];
                    if (points[i+1] < minY) minY = points[i+1];
                    if (points[i+1] > maxY) maxY = points[i+1];
                }
                const width = maxX - minX;
                const height = maxY - minY;

                if (width > 50 && height < 25) {
                     const midY = Math.round(((minY + maxY) / 2) / GRID_SIZE) * GRID_SIZE;
                     const startX = Math.round(minX / GRID_SIZE) * GRID_SIZE;
                     const endX = Math.round(maxX / GRID_SIZE) * GRID_SIZE;
                     return { ...line, points: [startX, midY, endX, midY] };
                } else if (height > 50 && width < 25) {
                     const midX = Math.round(((minX + maxX) / 2) / GRID_SIZE) * GRID_SIZE;
                     const startY = Math.round(minY / GRID_SIZE) * GRID_SIZE;
                     const endY = Math.round(maxY / GRID_SIZE) * GRID_SIZE;
                     return { ...line, points: [midX, startY, midX, endY] };
                }
            }
            return line;
        });

        setShapes([...newShapes, ...newShapesFromPens]);
        setLines(finalLines);
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            <div className={`flex gap-2 mb-2 ${theme.isDark ? 'bg-black/40 border-white/10' : 'bg-black/5 border-black/10'} p-2 rounded-lg border items-center`}>
                <button onClick={() => setTool('pen')} className={`p-1.5 rounded-lg transition-colors ${tool==='pen' ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'}` : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-black/10')}`}><Pencil size={18}/></button>
                <button onClick={() => setTool('rect')} className={`p-1.5 rounded-lg transition-colors ${tool==='rect' ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'}` : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-black/10')}`}><Square size={18}/></button>
                <button onClick={() => setTool('circle')} className={`p-1.5 rounded-lg transition-colors ${tool==='circle' ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'}` : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-black/10')}`}><Circle size={18}/></button>
                <button onClick={() => setTool('text')} className={`p-1.5 rounded-lg transition-colors ${tool==='text' ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'}` : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-black/10')}`}><Type size={18}/></button>
                <button onClick={() => setTool('eraser')} className={`p-1.5 rounded-lg transition-colors ${tool==='eraser' ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'}` : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-black/10')}`}><Eraser size={18}/></button>
                
                <div className={`h-6 w-px ${theme.isDark ? 'bg-white/20' : 'bg-black/20'} mx-1`}></div>
                
                {/* Color Palette */}
                <div className={`flex gap-1.5 items-center ${theme.isDark ? 'bg-black/30' : 'bg-black/10'} p-1 rounded-md`}>
                    {['#1f2937', '#dc2626', '#2563eb', '#16a34a', '#9333ea'].map(c => (
                        <button 
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex-1"></div>
                <button onClick={handleBeautify} className="p-1.5 rounded-lg text-[#a855f7] hover:bg-[#a855f7]/20 transition-colors" title="Beautify Geometry"><Sparkles size={18}/></button>
                <button onClick={() => { setLines([]); setShapes([]); setTexts([]); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 ml-2 transition-colors"><Trash2 size={18}/></button>
            </div>
            
            <div className="flex-1 bg-white rounded-xl overflow-hidden relative border-2 border-[#00f5ff]/20 cursor-crosshair">
                <Stage
                    width={480}
                    height={300}
                    onMouseDown={handleMouseDown}
                    onMousemove={handleMouseMove}
                    onMouseup={handleMouseUp}
                    ref={stageRef}
                >
                    {/* White background for the exported image */}
                    <Layer>
                        <Rect x={0} y={0} width={480} height={300} fill="white" />
                        
                        {shapes.map((s, i) => (
                            s.type === 'rect' ? 
                            <Rect key={`r-${i}`} x={s.x} y={s.y} width={s.width} height={s.height} stroke={s.color || '#1f2937'} strokeWidth={3} /> :
                            s.type === 'circle' ? 
                            <KonvaCircle key={`c-${i}`} x={s.x} y={s.y} radius={s.radius} stroke={s.color || '#1f2937'} strokeWidth={3} /> :
                            <Line key={`p-${i}`} points={s.points} stroke={s.color || '#1f2937'} strokeWidth={3} closed={true} lineCap="round" lineJoin="round" />
                        ))}
                        
                        {lines.map((line, i) => (
                            <Line
                                key={`l-${i}`}
                                points={line.points}
                                stroke={line.color || (line.tool === 'eraser' ? 'white' : '#1f2937')}
                                strokeWidth={line.tool === 'eraser' ? 20 : 3}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                            />
                        ))}

                        {texts.map((t, i) => (
                            <KonvaText key={`t-${i}`} x={t.x} y={t.y} text={t.text} fontSize={20} fill={t.color || "#2563eb"} fontFamily="monospace" fontStyle="bold" />
                        ))}
                    </Layer>
                </Stage>

                {textInputPos && (
                    <input
                        autoFocus
                        value={currentText}
                        onChange={e => setCurrentText(e.target.value)}
                        onKeyDown={handleTextSubmit}
                        onBlur={handleTextBlur}
                        className="absolute bg-blue-50 border-2 border-blue-500 text-blue-700 px-2 py-1 outline-none rounded font-mono font-bold shadow-lg"
                        style={{ top: textInputPos.y, left: textInputPos.x }}
                        placeholder="Type & Enter..."
                    />
                )}
            </div>

            <button
                onClick={handleSolve}
                className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#a855f7] to-[#00f5ff] hover:from-[#b86cf7] hover:to-[#1cf5ff] py-3.5 rounded-xl transition-all font-orbitron tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02] text-black dark:text-white"
            >
                <Wand2 size={20} /> Solve with AI
            </button>
        </div>
    );
};

export default GeometryCanvas;
