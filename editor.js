trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        trapez.setAttribute('stroke', '#007bff');
        trapez.setAttribute('stroke-width', '3');
        group.appendChild(trapez);
    } else if (variant === 'parallelogramm') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const skewAngle = (data.skewAngle || 15) * Math.PI / 180;
        const skewOffset = width * Math.tan(skewAngle);
        
        const points = `
            ${CANVAS_CENTER_X - length/2 + skewOffset},${CANVAS_CENTER_Y - width/2}
            ${CANVAS_CENTER_X + length/2 + skewOffset},${CANVAS_CENTER_Y - width/2}
            ${CANVAS_CENTER_X + length/2 - skewOffset},${CANVAS_CENTER_Y + width/2}
            ${CANVAS_CENTER_X - length/2 - skewOffset},${CANVAS_CENTER_Y + width/2}
        `;
        
        const parallelogram = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        parallelogram.setAttribute('points', points);
        parallelogram.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        parallelogram.setAttribute('stroke', '#007bff');
        parallelogram.setAttribute('stroke-width', '3');
        group.appendChild(parallelogram);
    } else if (variant === 'rhombus') {
        const side = (data.side || 6) * scale;
        const acuteAngle = (data.acuteAngle || 60) * Math.PI / 180;
        const height = side * Math.sin(acuteAngle);
        const width = side * Math.cos(acuteAngle);
        
        const points = `
            ${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2}
            ${CANVAS_CENTER_X + width},${CANVAS_CENTER_Y}
            ${CANVAS_CENTER_X},${CANVAS_CENTER_Y + height/2}
            ${CANVAS_CENTER_X - width},${CANVAS_CENTER_Y}
        `;
        
        const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        rhombus.setAttribute('points', points);
        rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        rhombus.setAttribute('stroke', '#007bff');
        rhombus.setAttribute('stroke-width', '3');
        group.appendChild(rhombus);
    } else {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', CANVAS_CENTER_X - length/2);
        rect.setAttribute('y', CANVAS_CENTER_Y - width/2);
        rect.setAttribute('width', length);
        rect.setAttribute('height', width);
        rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        rect.setAttribute('stroke', '#007bff');
        rect.setAttribute('stroke-width', '3');
        group.appendChild(rect);
    }
}

function drawPolygonShape(group, data, scale = SCALE_FACTOR, variant = 'fuenfeck') {
    if (variant === 'fuenfeck') {
        const side = (data.side || 5) * scale;
        const radius = side / (2 * Math.sin(Math.PI / 5));
        let points = '';
        
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            points += `${x},${y} `;
        }
        
        const pentagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        pentagon.setAttribute('points', points.trim());
        pentagon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        pentagon.setAttribute('stroke', '#007bff');
        pentagon.setAttribute('stroke-width', '3');
        group.appendChild(pentagon);
    } else if (variant === 'sechseck') {
        const side = (data.side || 5) * scale;
        const radius = side;
        let points = '';
        
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            points += `${x},${y} `;
        }
        
        const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        hexagon.setAttribute('points', points.trim());
        hexagon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        hexagon.setAttribute('stroke', '#007bff');
        hexagon.setAttribute('stroke-width', '3');
        group.appendChild(hexagon);
    } else if (variant === 'achteck') {
        const side = (data.side || 5) * scale;
        const radius = side / (2 * Math.sin(Math.PI / 8));
        let points = '';
        
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            points += `${x},${y} `;
        }
        
        const octagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        octagon.setAttribute('points', points.trim());
        octagon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        octagon.setAttribute('stroke', '#007bff');
        octagon.setAttribute('stroke-width', '3');
        group.appendChild(octagon);
    } else if (variant === 'lform') {
        const totalLength = (data.totalLength || 8) * scale;
        const totalWidth = (data.totalWidth || 6) * scale;
        const armWidth = (data.armWidth || 3) * scale;
        const armLength = (data.armLength || 4) * scale;
        
        const points = `
            ${CANVAS_CENTER_X - totalLength/2},${CANVAS_CENTER_Y - totalWidth/2}
            ${CANVAS_CENTER_X - totalLength/2 + armLength},${CANVAS_CENTER_Y - totalWidth/2}
            ${CANVAS_CENTER_X - totalLength/2 + armLength},${CANVAS_CENTER_Y - totalWidth/2 + armWidth}
            ${CANVAS_CENTER_X + totalLength/2},${CANVAS_CENTER_Y - totalWidth/2 + armWidth}
            ${CANVAS_CENTER_X + totalLength/2},${CANVAS_CENTER_Y + totalWidth/2}
            ${CANVAS_CENTER_X - totalLength/2},${CANVAS_CENTER_Y + totalWidth/2}
        `;
        
        const lshape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        lshape.setAttribute('points', points);
        lshape.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        lshape.setAttribute('stroke', '#007bff');
        lshape.setAttribute('stroke-width', '3');
        group.appendChild(lshape);
    } else if (variant === 'tform') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 6) * scale;
        const stemWidth = (data.stemWidth || 3) * scale;
        const stemLength = (data.stemLength || 4) * scale;
        
        const points = `
            ${CANVAS_CENTER_X - stemWidth/2},${CANVAS_CENTER_Y - width/2}
            ${CANVAS_CENTER_X + stemWidth/2},${CANVAS_CENTER_Y - width/2}
            ${CANVAS_CENTER_X + stemWidth/2},${CANVAS_CENTER_Y - width/2 + stemLength}
            ${CANVAS_CENTER_X + length/2},${CANVAS_CENTER_Y - width/2 + stemLength}
            ${CANVAS_CENTER_X + length/2},${CANVAS_CENTER_Y + width/2}
            ${CANVAS_CENTER_X - length/2},${CANVAS_CENTER_Y + width/2}
            ${CANVAS_CENTER_X - length/2},${CANVAS_CENTER_Y - width/2 + stemLength}
            ${CANVAS_CENTER_X - stemWidth/2},${CANVAS_CENTER_Y - width/2 + stemLength}
        `;
        
        const tshape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        tshape.setAttribute('points', points);
        tshape.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        tshape.setAttribute('stroke', '#007bff');
        tshape.setAttribute('stroke-width', '3');
        group.appendChild(tshape);
    } else if (variant === 'uform') {
        const outerLength = (data.outerLength || 8) * scale;
        const outerWidth = (data.outerWidth || 6) * scale;
        const innerLength = (data.innerLength || 4) * scale;
        const innerWidth = (data.innerWidth || 2) * scale;
        const wallThickness = (outerLength - innerLength) / 2;
        const wallHeight = (outerWidth - innerWidth);
        
        const points = `
            ${CANVAS_CENTER_X - outerLength/2},${CANVAS_CENTER_Y - outerWidth/2}
            ${CANVAS_CENTER_X + outerLength/2},${CANVAS_CENTER_Y - outerWidth/2}
            ${CANVAS_CENTER_X + outerLength/2},${CANVAS_CENTER_Y + outerWidth/2}
            ${CANVAS_CENTER_X + innerLength/2},${CANVAS_CENTER_Y + outerWidth/2}
            ${CANVAS_CENTER_X + innerLength/2},${CANVAS_CENTER_Y - outerWidth/2 + wallHeight}
            ${CANVAS_CENTER_X - innerLength/2},${CANVAS_CENTER_Y - outerWidth/2 + wallHeight}
            ${CANVAS_CENTER_X - innerLength/2},${CANVAS_CENTER_Y + outerWidth/2}
            ${CANVAS_CENTER_X - outerLength/2},${CANVAS_CENTER_Y + outerWidth/2}
        `;
        
        const ushape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        ushape.setAttribute('points', points);
        ushape.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ushape.setAttribute('stroke', '#007bff');
        ushape.setAttribute('stroke-width', '3');
        group.appendChild(ushape);
    }
}

function drawCornerHandlesOnShape(group, data, scale = SCALE_FACTOR) {
    const corners = getActualCornerPositions(data, scale);
    
    corners.forEach((corner, index) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        handle.setAttribute('cx', corner.x);
        handle.setAttribute('cy', corner.y);
        handle.setAttribute('r', CORNER_RADIUS);
        handle.setAttribute('fill', 'rgba(0, 123, 255, 0.7)');
        handle.setAttribute('stroke', '#007bff');
        handle.setAttribute('stroke-width', '2');
        handle.style.cursor = 'grab';
        group.appendChild(handle);
        
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', corner.x);
        dot.setAttribute('cy', corner.y);
        dot.setAttribute('r', '2');
        dot.setAttribute('fill', 'white');
        dot.style.pointerEvents = 'none';
        group.appendChild(dot);
    });
}

function getActualCornerPositions(data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    if (finalShape === 'kreis') {
        if (variant === 'kreis') {
            const radius = (data.radius || 5) * scale;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radius },
                { x: CANVAS_CENTER_X + radius, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + radius },
                { x: CANVAS_CENTER_X - radius, y: CANVAS_CENTER_Y }
            ];
        } else if (variant === 'oval') {
            const radiusX = (data.length || 8) * scale / 2;
            const radiusY = (data.width || 5) * scale / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radiusY },
                { x: CANVAS_CENTER_X + radiusX, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + radiusY },
                { x: CANVAS_CENTER_X - radiusX, y: CANVAS_CENTER_Y }
            ];
        } else if (variant === 'halbkreis') {
            const radius = (data.radius || 5) * scale;
            corners = [
                { x: CANVAS_CENTER_X - radius, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radius },
                { x: CANVAS_CENTER_X + radius, y: CANVAS_CENTER_Y }
            ];
        } else if (variant === 'viertelkreis') {
            const radius = (data.radius || 5) * scale;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X + radius, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radius }
            ];
        } else if (variant === 'langloch') {
            const length = (data.length || 8) * scale;
            const width = (data.width || 3) * scale;
            const halfLength = (length - width) / 2;
            corners = [
                { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y + width/2 },
                { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y + width/2 }
            ];
        }
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            const side = (data.side || 6) * scale;
            const height = side * Math.sqrt(3) / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/3 },
                { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height*2/3 },
                { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height*2/3 }
            ];
        } else if (variant === 'rechtwinklig') {
            const katheteA = (data.katheteA || 4) * scale;
            const katheteB = (data.katheteB || 5) * scale;
            
            corners = [
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X + katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y - katheteB*2/3 }
            ];
        } else if (variant === 'ungleichschenklig') {
            const sideA = (data.sideA || 4) * scale;
            const sideB = (data.sideB || 5) * scale;
            const sideC = (data.sideC || 6) * scale;
            
            const cosA = (sideB*sideB + sideC*sideC - sideA*sideA) / (2 * sideB * sideC);
            const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));
            const height = sideB * Math.sin(angleA);
            
            const bottomY = CANVAS_CENTER_Y + height/3;
            const topY = CANVAS_CENTER_Y - height*2/3;
            const leftX = CANVAS_CENTER_X - sideC/2;
            const rightX = CANVAS_CENTER_X + sideC/2;
            const peakX = CANVAS_CENTER_X - sideC/2 + sideB * Math.cos(angleA);
            
            corners = [
                { x: peakX, y: topY },
                { x: leftX, y: bottomY },
                { x: rightX, y: bottomY }
            ];
        }
    } else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    } else if (finalShape === 'vieleck') {
        if (variant === 'fuenfeck') {
            const side = (data.side || 5) * scale;
            const radius = side / (2 * Math.sin(Math.PI / 5));
            
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                corners.push({
                    x: CANVAS_CENTER_X + radius * Math.cos(angle),
                    y: CANVAS_CENTER_Y + radius * Math.sin(angle)
                });
            }
        } else if (variant === 'sechseck') {
            const side = (data.side || 5) * scale;
            const radius = side;
            
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;
                corners.push({
                    x: CANVAS_CENTER_X + radius * Math.cos(angle),
                    y: CANVAS_CENTER_Y + radius * Math.sin(angle)
                });
            }
        } else if (variant === 'achteck') {
            const side = (data.side || 5) * scale;
            const radius = side / (2 * Math.sin(Math.PI / 8));
            
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                corners.push({
                    x: CANVAS_CENTER_X + radius * Math.cos(angle),
                    y: CANVAS_CENTER_Y + radius * Math.sin(angle)
                });
            }
        } else if (variant === 'lform') {
            const totalLength = (data.totalLength || 8) * scale;
            const totalWidth = (data.totalWidth || 6) * scale;
            const armWidth = (data.armWidth || 3) * scale;
            const armLength = (data.armLength || 4) * scale;
            
            corners = [
                { x: CANVAS_CENTER_X - totalLength/2, y: CANVAS_CENTER_Y - totalWidth/2 },
                { x: CANVAS_CENTER_X - totalLength/2 + armLength, y: CANVAS_CENTER_Y - totalWidth/2 },
                { x: CANVAS_CENTER_X - totalLength/2 + armLength, y: CANVAS_CENTER_Y - totalWidth/2 + armWidth },
                { x: CANVAS_CENTER_X + totalLength/2, y: CANVAS_CENTER_Y - totalWidth/2 + armWidth },
                { x: CANVAS_CENTER_X + totalLength/2, y: CANVAS_CENTER_Y + totalWidth/2 },
                { x: CANVAS_CENTER_X - totalLength/2, y: CANVAS_CENTER_Y + totalWidth/2 }
            ];
        } else if (variant === 'tform' || variant === 'uform') {
            const length = (data.length || data.outerLength || 8) * scale;
            const width = (data.width || data.outerWidth || 6) * scale;
            
            corners = [
                { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
                { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
            ];
        }
    } else {
        if (variant === 'trapez') {
            const baseBottom = (data.baseBottom || 8) * scale;
            const baseTop = (data.baseTop || 6) * scale;
            const height = (data.height || 5) * scale;
            
            corners = [
                { x: CANVAS_CENTER_X - baseBottom/2, y: CANVAS_CENTER_Y + height/2 },
                { x: CANVAS_CENTER_X + baseBottom/2, y: CANVAS_CENTER_Y + height/2 },
                { x: CANVAS_CENTER_X + baseTop/2, y: CANVAS_CENTER_Y - height/2 },
                { x: CANVAS_CENTER_X - baseTop/2, y: CANVAS_CENTER_Y - height/2 }
            ];
        } else if (variant === 'parallelogramm') {
            const length = (data.length || 8) * scale;
            const width = (data.width || 5) * scale;
            const skewAngle = (data.skewAngle || 15) * Math.PI / 180;
            const skewOffset = width * Math.tan(skewAngle);
            
            corners = [
                { x: CANVAS_CENTER_X - length/2 + skewOffset, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2 + skewOffset, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2 - skewOffset, y: CANVAS_CENTER_Y + width/2 },
                { x: CANVAS_CENTER_X - length/2 - skewOffset, y: CANVAS_CENTER_Y + width/2 }
            ];
        } else if (variant === 'rhombus') {
            const side = (data.side || 6) * scale;
            const acuteAngle = (data.acuteAngle || 60) * Math.PI / 180;
            const height = side * Math.sin(acuteAngle);
            const width = side * Math.cos(acuteAngle);
            
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/2 },
                { x: CANVAS_CENTER_X + width, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + height/2 },
                { x: CANVAS_CENTER_X - width, y: CANVAS_CENTER_Y }
            ];
        } else {
            const length = (data.length || 8) * scale;
            const width = (data.width || 5) * scale;
            
            corners = [
                { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
                { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
                { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
            ];
        }
    }
    
    if (currentRotation !== 0) {
        const angle = (currentRotation * Math.PI) / 180;
        corners = corners.map(corner => {
            const relX = corner.x - CANVAS_CENTER_X;
            const relY = corner.y - CANVAS_CENTER_Y;
            return {
                x: CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle),
                y: CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle)
            };
        });
    }
    
    return corners;
}

function drawLabelsOnShape(group, data, scale = SCALE_FACTOR) {
    const corners = getActualCornerPositions(data, scale);
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    if (finalShape === 'dreieck' && corners.length >= 3) {
        const labels = ['A', 'B', 'C'];
        const colors = ['#dc3545', '#28a745', '#ffc107'];
        
        for (let i = 0; i < 3; i++) {
            const nextI = (i + 1) % 3;
            const midX = (corners[i].x + corners[nextI].x) / 2;
            const midY = (corners[i].y + corners[nextI].y) / 2;
            
            const offsetX = i === 0 ? 0 : (i === 1 ? -15 : 15);
            const offsetY = i === 0 ? 15 : (i === 1 ? 0 : 0);
            
            const label = createLabel(midX + offsetX, midY + offsetY, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (corners.length >= 4 && (finalShape === 'viereck' || finalShape === 'quadrat' || variant === 'trapez')) {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        const offsets = [
            { x: 0, y: -12 },
            { x: 12, y: 0 },
            { x: 0, y: 15 },
            { x: -12, y: 0 }
        ];
        
        for (let i = 0; i < Math.min(4, corners.length); i++) {
            const nextI = (i + 1) % corners.length;
            const midX = (corners[i].x + corners[nextI].x) / 2;
            const midY = (corners[i].y + corners[nextI].y) / 2;
            const label = createLabel(midX + offsets[i].x, midY + offsets[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (finalShape === 'kreis') {
        if (variant === 'kreis') {
            const centerLabel = createLabel(CANVAS_CENTER_X, CANVAS_CENTER_Y, 'R', '#007bff');
            group.appendChild(centerLabel);
        } else if (variant === 'oval') {
            const aLabel = createLabel(CANVAS_CENTER_X + (data.length || 8) * scale / 2 - 10, CANVAS_CENTER_Y, 'A', '#007bff');
            const bLabel = createLabel(CANVAS_CENTER_X, CANVAS_CENTER_Y - (data.width || 5) * scale / 2 - 10, 'B', '#28a745');
            group.appendChild(aLabel);
            group.appendChild(bLabel);
        }
    } else if (finalShape === 'vieleck') {
        if (corners.length <= 8) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];
            
            for (let i = 0; i < corners.length; i++) {
                const nextI = (i + 1) % corners.length;
                const midX = (corners[i].x + corners[nextI].x) / 2;
                const midY = (corners[i].y + corners[nextI].y) / 2;
                
                const angle = Math.atan2(midY - CANVAS_CENTER_Y, midX - CANVAS_CENTER_X);
                const offsetX = Math.cos(angle) * 15;
                const offsetY = Math.sin(angle) * 15;
                
                const label = createLabel(midX + offsetX, midY + offsetY, labels[i], colors[i % colors.length]);
                group.appendChild(label);
            }
        }
    }
}

function createLabel(x, y, text, color) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '2');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = text;
    return label;
}

// === MAUS-EVENTS ===
function handleMouseDown(event) {
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    if (isNearCorner(mouseX, mouseY)) {
        startDragging(mouseX, mouseY);
    }
}

function handleMouseMove(event) {
    if (!isDragging) {
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        svg.style.cursor = isNearCorner(mouseX, mouseY) ? 'grab' : 'default';
        return;
    }
    
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    updateRotation(mouseX, mouseY);
}

function handleMouseUp(event) {
    if (isDragging) {
        stopDragging();
    }
}

function isNearCorner(x, y) {
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    const corners = getActualCornerPositions(data, scale);
    
    for (const corner of corners) {
        const distance = Math.sqrt((x - corner.x) * (x - corner.x) + (y - corner.y) * (y - corner.y));
        if (distance <= CORNER_RADIUS * 2) {
            return true;
        }
    }
    return false;
}

function startDragging(x, y) {
    isDragging = true;
    svg.style.cursor = 'grabbing';
    dragStartAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    dragStartRotation = currentRotation;
}

function updateRotation(x, y) {
    if (!isDragging) return;
    
    const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    let angleDiff = currentAngle - dragStartAngle;
    
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    let newRotation = dragStartRotation + (angleDiff * 180 / Math.PI);
    
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    const corners = getActualCornerPositions(data, scale);
    const isHorizontal = checkForHorizontalBase(corners);
    
    if (isHorizontal) {
        if (!document.getElementById('snap-feedback')) {
            showSnapFeedback();
            highlightBottomEdge(corners);
        }
    } else {
        removeSnapEffects();
    }
    
    updateShapeWithScale(scale);
    updateRotationDisplay();
}

function checkForHorizontalBase(corners) {
    if (corners.length < 3) return false;
    
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    const yDiff = Math.abs(bottomPoints[0].y - bottomPoints[1].y);
    return yDiff <= 3;
}

function highlightBottomEdge(corners) {
    removeSnapEffects();
    
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    bottomPoints.sort((a, b) => a.x - b.x);
    
    const highlightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    highlightLine.id = 'bottom-edge-highlight';
    highlightLine.setAttribute('x1', bottomPoints[0].x);
    highlightLine.setAttribute('y1', bottomPoints[0].y);
    highlightLine.setAttribute('x2', bottomPoints[1].x);
    highlightLine.setAttribute('y2', bottomPoints[1].y);
    highlightLine.setAttribute('stroke', '#28a745');
    highlightLine.setAttribute('stroke-width', '6');
    highlightLine.setAttribute('opacity', '0.8');
    highlightLine.style.pointerEvents = 'none';
    
    svg.appendChild(highlightLine);
    
    highlightLine.animate([
        { opacity: 0.8 }, { opacity: 0.3 }, { opacity: 0.8 }
    ], { duration: 500, iterations: 2 });
}

function showSnapFeedback() {
    const feedback = document.createElement('div');
    feedback.id = 'snap-feedback';
    feedback.style.cssText = `
        position: absolute; top: 50px; right: 10px; background: #28a745; color: white;
        padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;
        z-index: 1001; pointer-events: none;
    `;
    feedback.textContent = '📐 Eingerastet!';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { canvasWrapper.appendChild(feedback); }
}

function removeSnapEffects() {
    const snapFeedback = document.getElementById('snap-feedback');
    if (snapFeedback) { snapFeedback.remove(); }
    
    const highlight = document.getElementById('bottom-edge-highlight');
    if (highlight) { highlight.remove(); }
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
    
    setTimeout(() => { removeSnapEffects(); }, 1000);
}

// === BERECHNUNGEN ===
function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'kreis') {
        if (finalVariant === 'kreis') {
            const radius = data.radius || 5;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
        } else if (finalVariant === 'oval') {
            const a = (data.length || 8) / 2;
            const b = (data.width || 5) / 2;
            area = Math.PI * a * b;
            perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
        } else if (finalVariant === 'halbkreis') {
            const radius = data.radius || 5;
            area = (Math.PI * radius * radius) / 2;
            perimeter = Math.PI * radius + 2 * radius;
        } else if (finalVariant === 'viertelkreis') {
            const radius = data.radius || 5;
            area = (Math.PI * radius * radius) / 4;
            perimeter = (Math.PI * radius) / 2 + 2 * radius;
        } else if (finalVariant === 'langloch') {
            const length = data.length || 8;
            const width = data.width || 3;
            const radius = width / 2;
            area = (length - width) * width + Math.PI * radius * radius;
            perimeter = 2 * (length - width) + 2 * Math.PI * radius;
        }
    } else if (finalShape === 'dreieck') {
        if (finalVariant === 'rechtwinklig') {
            const a = data.katheteA || 4;
            const b = data.katheteB || 5;
            area = 0.5 * a * b;
            const c = Math.sqrt(a*a + b*b);
            perimeter = a + b + c;
        } else if (finalVariant === 'gleichseitig') {
            const s = data.side || 6;
            area = (Math.sqrt(3) / 4) * s * s;
            perimeter = 3 * s;
        } else if (finalVariant === 'ungleichschenklig') {
            const a = data.sideA || 4;
            const b = data.sideB || 5;
            const c = data.sideC || 6;
            const s = (a + b + c) / 2;
            area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            perimeter = a + b + c;
        }
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        area = side * side;
        perimeter = 4 * side;
    } else if (finalShape === 'vieleck') {
        if (finalVariant === 'fuenfeck') {
            const side = data.side || 5;
            area = (5 * side * side) / (4 * Math.tan(Math.PI / 5));
            perimeter = 5 * side;
        } else if (finalVariant === 'sechseck') {
            const side = data.side || 5;
            area = (3 * Math.sqrt(3) / 2) * side * side;
            perimeter = 6 * side;
        } else if (finalVariant === 'achteck') {
            const side = data.side || 5;
            area = 2 * (1 + Math.sqrt(2)) * side * side;
            perimeter = 8 * side;
        } else if (finalVariant === 'lform') {
            const totalLength = data.totalLength || 8;
            const totalWidth = data.totalWidth || 6;
            const armWidth = data.armWidth || 3;
            const armLength = data.armLength || 4;
            area = totalLength * totalWidth - (totalLength - armLength) * (totalWidth - armWidth);
            perimeter = 2 * totalLength + 2 * totalWidth - 2 * armWidth;
        } else if (finalVariant === 'tform') {
            const length = data.length || 8;
            const width = data.width || 6;
            const stemWidth = data.stemWidth || 3;
            const stemLength = data.stemLength || 4;
            area = length * stemLength + stemWidth * (width - stemLength);
            perimeter = 2 * length + 2 * width - 2 * stemWidth;
        } else if (finalVariant === 'uform') {
            const outerLength = data.outerLength || 8;
            const outerWidth = data.outerWidth || 6;
            const innerLength = data.innerLength || 4;
            const innerWidth = data.innerWidth || 2;
            area = outerLength * outerWidth - innerLength * innerWidth;
            perimeter = 2 * outerLength + 2 * outerWidth - 2 * innerLength;
        }
    } else {
        if (finalVariant === 'trapez') {
            const baseBottom = data.baseBottom || 8;
            const baseTop = data.baseTop || 6;
            const height = data.height || 5;
            area = 0.5 * (baseBottom + baseTop) * height;
            const sideLength = Math.sqrt(height * height + Math.pow((baseBottom - baseTop) / 2, 2));
            perimeter = baseBottom + baseTop + 2 * sideLength;
        } else if (finalVariant === 'parallelogramm') {
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
        } else if (finalVariant === 'rhombus') {
            const side = data.side || 6;
            const acuteAngle = (data.acuteAngle || 60) * Math.PI / 180;
            area = side * side * Math.sin(acuteAngle);
            perimeter = 4 * side;
        } else {
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
        }
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetToDefaults();
        });
    }
}

function resetToDefaults() {
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        const defaultValues = {
            'side': '5', 'radius': '5', 'katheteA': '4', 'katheteB': '5',
            'sideA': '4', 'sideB': '5', 'sideC': '6', 'length': '8', 'width': '5',
            'baseBottom': '8', 'baseTop': '6', 'height': '5', 'skewAngle': '15',
            'acuteAngle': '60', 'totalLength': '8', 'totalWidth': '6',
            'armWidth': '3', 'armLength': '4', 'stemWidth': '3', 'stemLength': '4',
            'outerLength': '8', 'outerWidth': '6', 'innerLength': '4', 'innerWidth': '2'
        };
        
        input.value = defaultValues[input.id] || '5';
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message) {
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(fb => fb.remove());
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: #28a745; color: white;
        padding: 12px 20px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px; font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => { if (feedback.parentNode) { feedback.remove(); } }, 300);
    }, 3000);
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { projectData.roofShape = {}; }
    Object.assign(projectData.roofShape, currentData);
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    let points = [];
    
    if (finalShape === 'kreis') {
        if (finalVariant === 'kreis') {
            const radius = data.radius || 5;
            const segments = 16;
            for (let i = 0; i < segments; i++) {
                const angle = (i * 2 * Math.PI) / segments;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else if (finalVariant === 'oval') {
            const a = (data.length || 8) / 2;
            const b = (data.width || 5) / 2;
            const segments = 16;
            for (let i = 0; i < segments; i++) {
                const angle = (i * 2 * Math.PI) / segments;
                points.push({
                    x: a * Math.cos(angle),
                    y: b * Math.sin(angle)
                });
            }
        } else if (finalVariant === 'halbkreis') {
            const radius = data.radius || 5;
            const segments = 8;
            for (let i = 0; i <= segments; i++) {
                const angle = (i * Math.PI) / segments;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        }
    } else if (finalShape === 'dreieck') {
        if (finalVariant === 'gleichseitig') {
            const side = data.side || 6;
            const height = side * Math.sqrt(3) / 2;
            points = [
                { x: 0, y: height * 2/3 },
                { x: -side/2, y: -height/3 },
                { x: side/2, y: -height/3 }
            ];
        } else if (finalVariant === 'rechtwinklig') {
            const a = data.katheteA || 4;
            const b = data.katheteB || 5;
            points = [
                { x: -a/2, y: -b/3 },
                { x: a/2, y: -b/3 },
                { x: -a/2, y: 2*b/3 }
            ];
        } else if (finalVariant === 'ungleichschenklig') {
            const sideA = data.sideA || 4;
            const sideB = data.sideB || 5;
            const sideC = data.sideC || 6;
            
            const cosA = (sideB*sideB + sideC*sideC - sideA*sideA) / (2 * sideB * sideC);
            const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));
            const height = sideB * Math.sin(angleA);
            
            const peakX = -sideC/2 + sideB * Math.cos(angleA);
            
            points = [
                { x: peakX, y: height/2 },
                { x: -sideC/2, y: -height/2 },
                { x: sideC/2, y: -height/2 }
            ];
        }
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        points = [
            { x: -side/2, y: -side/2 },
            { x: side/2, y: -side/2 },
            { x: side/2, y: side/2 },
            { x: -side/2, y: side/2 }
        ];
    } else if (finalShape === 'vieleck') {
        if (finalVariant === 'fuenfeck') {
            const side = data.side || 5;
            const radius = side / (2 * Math.sin(Math.PI / 5));
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else if (finalVariant === 'sechseck') {
            const side = data.side || 5;
            const radius = side;
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else if (finalVariant === 'lform') {
            const totalLength = data.totalLength || 8;
            const totalWidth = data.totalWidth || 6;
            const armWidth = data.armWidth || 3;
            const armLength = data.armLength || 4;
            points = [
                { x: -totalLength/2, y: -totalWidth/2 },
                { x: -totalLength/2 + armLength, y: -totalWidth/2 },
                { x: -totalLength/2 + armLength, y: -totalWidth/2 + armWidth },
                { x: totalLength/2, y: -totalWidth/2 + armWidth },
                { x: totalLength/2, y: totalWidth/2 },
                { x: -totalLength/2, y: totalWidth/2 }
            ];
        }
    } else {
        if (finalVariant === 'trapez') {
            const baseBottom = data.baseBottom || 8;
            const baseTop = data.baseTop || 6;
            const height = data.height || 5;
            points = [
                { x: -baseBottom/2, y: -height/2 },
                { x: baseBottom/2, y: -height/2 },
                { x: baseTop/2, y: height/2 },
                { x: -baseTop/2, y: height/2 }
            ];
        } else {
            const length = data.length || 8;
            const width = data.width || 5;
            points = [
                { x: -length/2, y: -width/2 },
                { x: length/2, y: -width/2 },
                { x: length/2, y: width/2 },
                { x: -length/2, y: width/2 }
            ];
        }
    }
    
    if (points.length === 0) {
        points = [
            { x: -4, y: -2.5 }, { x: 4, y: -2.5 },
            { x: 4, y: 2.5 }, { x: -4, y: 2.5 }
        ];
    }
    
    return points;
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'kreis') {
        if (finalVariant === 'kreis') {
            const radius = data.radius || 5;
            return Math.PI * radius * radius;
        } else if (finalVariant === 'oval') {
            const a = (data.length || 8) / 2;
            const b = (data.width || 5) / 2;
            return Math.PI * a * b;
        }
    } else if (finalShape === 'dreieck') {
        if (finalVariant === 'rechtwinklig') {
            return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
        } else if (finalVariant === 'gleichseitig') {
            const s = data.side || 6;
            return (Math.sqrt(3) / 4) * s * s;
        }
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        return side * side;
    } else if (finalVariant === 'trapez') {
        const baseBottom = data.baseBottom || 8;
        const baseTop = data.baseTop || 6;
        const height = data.height || 5;
        return 0.5 * (baseBottom + baseTop) * height;
    } else {
        return (data.length || 8) * (data.width || 5);
    }
    
    return 40;
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'kreis') {
        if (finalVariant === 'kreis') {
            const diameter = (data.radius || 5) * 2;
            return { length: diameter, width: diameter };
        } else if (finalVariant === 'oval') {
            return { length: data.length || 8, width: data.width || 5 };
        }
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        return { length: side, width: side };
    } else if (finalVariant === 'trapez') {
        const baseBottom = data.baseBottom || 8;
        const height = data.height || 5;
        return { length: baseBottom, width: height };
    } else {
        return { length: data.length || 8, width: data.width || 5 };
    }
}// BEREINIGTE editor.js - Ohne Debug-Spam

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;

// Interaktion state
let isDragging = false;
let dragStartAngle = 0;
let dragStartRotation = 0;
let rotationCenter = { x: 0, y: 0 };

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 60;
const CORNER_RADIUS = 8;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
        } catch (error) {
            console.error('Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        if (!projectData.profile) {
            projectData.profile = { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 };
        }
        if (!projectData.roofShape) {
            projectData.roofShape = { baseShape: 'viereck', variant: 'rechteck' };
        }
    } catch (e) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
    }
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
    
    svg.addEventListener('mousedown', handleMouseDown);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseup', handleMouseUp);
    svg.addEventListener('mouseleave', handleMouseUp);
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    if (!container) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #e9ecef; border-radius: 8px; background: white;
        width: 600px; height: 400px; margin: 20px auto; position: relative; user-select: none;
    `;
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    svg.style.cursor = 'default';
    
    svg.innerHTML = `
        <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e0e0e0" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="300" y1="0" x2="300" y2="400" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="#c0c0c0" stroke-width="2"/>
        <g id="roof-shape"></g>
        <g id="corner-handles"></g>
        <g id="labels"></g>
    `;
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    createRotationDisplay();
}

function createRotationDisplay() {
    const existing = document.getElementById('rotation-display');
    if (existing) existing.remove();
    
    const display = document.createElement('div');
    display.id = 'rotation-display';
    display.style.cssText = `
        position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white;
        padding: 8px 12px; border-radius: 6px; font-family: 'Courier New', monospace;
        font-size: 14px; font-weight: bold; z-index: 1000; pointer-events: none;
    `;
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { canvasWrapper.appendChild(display); }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        const roundedRotation = Math.round(currentRotation * 10) / 10;
        display.textContent = roundedRotation + '°';
        display.style.background = Math.abs(roundedRotation % 90) < 1 ? '#28a745' : 'rgba(0, 0, 0, 0.8)';
    }
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': (profile.deckbreite || 1000) + ' mm',
        'current-lieferbreite': (profile.lieferbreite || 1050) + ' mm',
        'current-seitenueberlappung': (profile.seitenueberlappung || 50) + ' mm'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) { element.textContent = value; }
    });
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus',
        'vieleck': 'Vieleck', 'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    const element = document.getElementById('current-shape-name');
    if (element) { element.textContent = shapeName; }
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    } else {
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        if (roofShape.rotation !== undefined) currentRotation = roofShape.rotation;
    }
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    if (currentVariant === 'quadrat') return 'quadrat';
    if (currentVariant === 'trapez') return 'trapez';
    return currentShape || 'rechteck';
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    if (finalShape === 'kreis') {
        if (finalVariant === 'kreis') {
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
        } else if (finalVariant === 'oval') {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        } else if (finalVariant === 'halbkreis') {
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
        } else if (finalVariant === 'viertelkreis') {
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
        } else if (finalVariant === 'langloch') {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
        }
    } else if (finalShape === 'dreieck') {
        if (finalVariant === 'gleichseitig') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        } else if (finalVariant === 'rechtwinklig') {
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
        } else if (finalVariant === 'ungleichschenklig') {
            container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
        }
    } else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    } else if (finalShape === 'vieleck') {
        if (finalVariant === 'fuenfeck') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
        } else if (finalVariant === 'sechseck') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
        } else if (finalVariant === 'achteck') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
        } else if (finalVariant === 'lform') {
            container.appendChild(createInput('Länge gesamt (m)', 'totalLength', savedData.totalLength || '8'));
            container.appendChild(createInput('Breite gesamt (m)', 'totalWidth', savedData.totalWidth || '6'));
            container.appendChild(createInput('Schenkel Breite (m)', 'armWidth', savedData.armWidth || '3'));
            container.appendChild(createInput('Schenkel Länge (m)', 'armLength', savedData.armLength || '4'));
        } else if (finalVariant === 'tform') {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '6'));
            container.appendChild(createInput('Steg Breite (m)', 'stemWidth', savedData.stemWidth || '3'));
            container.appendChild(createInput('Steg Länge (m)', 'stemLength', savedData.stemLength || '4'));
        } else if (finalVariant === 'uform') {
            container.appendChild(createInput('Länge außen (m)', 'outerLength', savedData.outerLength || '8'));
            container.appendChild(createInput('Breite außen (m)', 'outerWidth', savedData.outerWidth || '6'));
            container.appendChild(createInput('Länge innen (m)', 'innerLength', savedData.innerLength || '4'));
            container.appendChild(createInput('Breite innen (m)', 'innerWidth', savedData.innerWidth || '2'));
        }
    } else {
        if (finalVariant === 'parallelogramm') {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
            container.appendChild(createInput('Neigungswinkel (°)', 'skewAngle', savedData.skewAngle || '15'));
        } else if (finalVariant === 'trapez' || finalShape === 'trapez') {
            container.appendChild(createInput('Basis unten (m)', 'baseBottom', savedData.baseBottom || '8'));
            container.appendChild(createInput('Basis oben (m)', 'baseTop', savedData.baseTop || '6'));
            container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '5'));
        } else if (finalVariant === 'rhombus') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
            container.appendChild(createInput('Spitzer Winkel (°)', 'acuteAngle', savedData.acuteAngle || '60'));
        } else {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        }
    }
}

function createInput(labelText, id, defaultValue) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue || '';
    input.step = '0.1';
    input.min = '0.1';
    
    input.addEventListener('input', handleInputChange);
    input.addEventListener('change', handleInputChange);
    
    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = labelText.includes('Winkel') ? '°' : 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    isUpdating = true;
    
    const data = getCurrentFormData();
    const newScale = calculateOptimalScale(data);
    
    updateShapeWithScale(newScale);
    
    setTimeout(() => { isUpdating = false; }, 50);
}

function calculateOptimalScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    let maxDimension = 0;
    
    if (finalShape === 'kreis') {
        if (variant === 'kreis' || variant === 'halbkreis' || variant === 'viertelkreis') {
            maxDimension = (data.radius || 5) * 2;
        } else {
            maxDimension = Math.max(data.length || 8, data.width || 5);
        }
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            maxDimension = data.side || 6;
        } else if (variant === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
        }
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else if (finalShape === 'vieleck') {
        if (variant === 'lform' || variant === 'tform' || variant === 'uform') {
            maxDimension = Math.max(
                data.totalLength || data.outerLength || data.length || 8, 
                data.totalWidth || data.outerWidth || data.width || 6
            );
        } else {
            maxDimension = (data.side || 5) * 2;
        }
    } else {
        if (variant === 'trapez') {
            maxDimension = Math.max(data.baseBottom || 8, data.baseTop || 6, data.height || 5);
        } else {
            maxDimension = Math.max(data.length || 8, data.width || 5);
        }
    }
    
    const availableSpace = Math.min(450, 280);
    let scale = (availableSpace * 0.6) / maxDimension;
    
    scale = Math.max(scale, 20);
    scale = Math.min(scale, 80);
    
    return scale;
}

function updateShapeWithScale(scale) {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    if (shapeGroup) {
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    if (cornerGroup) {
        drawCornerHandlesOnShape(cornerGroup, data, scale);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
}

function updateShape() {
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    updateShapeWithScale(scale);
}

function getCurrentFormData() {
    const data = { 
        shape: currentShape, 
        variant: currentVariant,
        baseShape: currentShape
    };
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
            }
        }
    });
    
    return data;
}

function drawCurrentShape(group, data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale, finalVariant);
    } else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale, finalVariant);
    } else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'vieleck') {
        drawPolygonShape(group, data, scale, finalVariant);
    } else {
        drawRectangleShape(group, data, scale, finalVariant);
    }
    
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

function drawCircleShape(group, data, scale = SCALE_FACTOR, variant = 'kreis') {
    if (variant === 'kreis') {
        const radius = (data.radius || 5) * scale;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', CANVAS_CENTER_X);
        circle.setAttribute('cy', CANVAS_CENTER_Y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        circle.setAttribute('stroke', '#007bff');
        circle.setAttribute('stroke-width', '3');
        group.appendChild(circle);
    } else if (variant === 'oval') {
        const radiusX = (data.length || 8) * scale / 2;
        const radiusY = (data.width || 5) * scale / 2;
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', CANVAS_CENTER_X);
        ellipse.setAttribute('cy', CANVAS_CENTER_Y);
        ellipse.setAttribute('rx', radiusX);
        ellipse.setAttribute('ry', radiusY);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        group.appendChild(ellipse);
    } else if (variant === 'halbkreis') {
        const radius = (data.radius || 5) * scale;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${CANVAS_CENTER_X - radius} ${CANVAS_CENTER_Y} A ${radius} ${radius} 0 0 1 ${CANVAS_CENTER_X + radius} ${CANVAS_CENTER_Y} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    } else if (variant === 'viertelkreis') {
        const radius = (data.radius || 5) * scale;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y} L ${CANVAS_CENTER_X + radius} ${CANVAS_CENTER_Y} A ${radius} ${radius} 0 0 1 ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y - radius} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    } else if (variant === 'langloch') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 3) * scale;
        const radius = width / 2;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const halfLength = (length - width) / 2;
        
        const d = `
            M ${CANVAS_CENTER_X - halfLength} ${CANVAS_CENTER_Y - radius}
            L ${CANVAS_CENTER_X + halfLength} ${CANVAS_CENTER_Y - radius}
            A ${radius} ${radius} 0 0 1 ${CANVAS_CENTER_X + halfLength} ${CANVAS_CENTER_Y + radius}
            L ${CANVAS_CENTER_X - halfLength} ${CANVAS_CENTER_Y + radius}
            A ${radius} ${radius} 0 0 1 ${CANVAS_CENTER_X - halfLength} ${CANVAS_CENTER_Y - radius}
            Z
        `;
        
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    }
}

function drawTriangleShape(group, data, scale = SCALE_FACTOR, variant = 'gleichseitig') {
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * scale;
        const height = side * Math.sqrt(3) / 2;
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/3;
        const leftX = CANVAS_CENTER_X - side/2;
        const leftY = CANVAS_CENTER_Y + height*2/3;
        const rightX = CANVAS_CENTER_X + side/2;
        const rightY = CANVAS_CENTER_Y + height*2/3;
        points = `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = `${leftX},${bottomY} ${rightX},${bottomY} ${leftX},${topY}`;
    } else if (variant === 'ungleichschenklig') {
        const sideA = (data.sideA || 4) * scale;
        const sideB = (data.sideB || 5) * scale;
        const sideC = (data.sideC || 6) * scale;
        
        const cosA = (sideB*sideB + sideC*sideC - sideA*sideA) / (2 * sideB * sideC);
        const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));
        const height = sideB * Math.sin(angleA);
        
        const bottomY = CANVAS_CENTER_Y + height/3;
        const topY = CANVAS_CENTER_Y - height*2/3;
        const leftX = CANVAS_CENTER_X - sideC/2;
        const rightX = CANVAS_CENTER_X + sideC/2;
        const peakX = CANVAS_CENTER_X - sideC/2 + sideB * Math.cos(angleA);
        
        points = `${peakX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    group.appendChild(triangle);
}

function drawSquareShape(group, data, scale = SCALE_FACTOR) {
    const side = (data.side || 5) * scale;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - side/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - side/2);
    rect.setAttribute('width', side);
    rect.setAttribute('height', side);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    group.appendChild(rect);
}

function drawRectangleShape(group, data, scale = SCALE_FACTOR, variant = 'rechteck') {
    if (variant === 'trapez') {
        const baseBottom = (data.baseBottom || 8) * scale;
        const baseTop = (data.baseTop || 6) * scale;
        const height = (data.height || 5) * scale;
        
        const points = `
            ${CANVAS_CENTER_X - baseBottom/2},${CANVAS_CENTER_Y + height/2}
            ${CANVAS_CENTER_X + baseBottom/2},${CANVAS_CENTER_Y + height/2}
            ${CANVAS_CENTER_X + baseTop/2},${CANVAS_CENTER_Y - height/2}
            ${CANVAS_CENTER_X - baseTop/2},${CANVAS_CENTER_Y - height/2}
        `;
        
        const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        trapez.setAttribute('points', points);
        trapez.setAttribute('fill', 'rgba(0, 123, 255, 0
