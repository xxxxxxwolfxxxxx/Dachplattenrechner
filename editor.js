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

function drawRectangleShape(group, data, scale = SCALE_FACTOR) {
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

// KORRIGIERT: Erweiterte Corner-Handles für alle Formen
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

// KORRIGIERT: Erweiterte Corner-Positionen für alle Formen
function getActualCornerPositions(data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    // Kreisformen - vereinfacht als Octagon für Handles
    if (finalShape === 'kreis') {
        const radius = (data.radius || 3) * scale;
        for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI) / 8;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
    } else if (finalShape === 'oval') {
        const radiusX = (data.radiusX || 4) * scale;
        const radiusY = (data.radiusY || 2.5) * scale;
        for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI) / 8;
            corners.push({
                x: CANVAS_CENTER_X + radiusX * Math.cos(angle),
                y: CANVAS_CENTER_Y + radiusY * Math.sin(angle)
            });
        }
    } else if (finalShape === 'halbkreis') {
        const radius = (data.radius || 4) * scale;
        // Halbkreis-Punkte
        for (let i = 0; i <= 6; i++) {
            const angle = (i * Math.PI) / 6;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y - radius * Math.sin(angle)
            });
        }
    } else if (finalShape === 'viertelkreis') {
        const radius = (data.radius || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X + radius, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radius }
        ];
        // Bogen-Punkte hinzufügen
        for (let i = 1; i < 4; i++) {
            const angle = (i * Math.PI / 2) / 4;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y - radius * Math.sin(angle)
            });
        }
    } else if (finalShape === 'langloch') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 3) * scale;
        const radius = width / 2;
        const halfLength = length / 2 - radius;
        
        corners = [
            { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y - radius },
            { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y - radius },
            { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y + radius },
            { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y + radius }
        ];
    }
    
    // Dreiecke
    else if (finalShape === 'dreieck') {
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
        } else {
            const sideA = (data.sideA || 4) * scale;
            const avgSide = ((data.sideB || 5) + (data.sideC || 6)) / 2;
            const height = avgSide * scale * 0.8;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/2 },
                { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },
                { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 }
            ];
        }
    }
    
    // Quadrat
    else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    }
    
    // Trapez
    else if (finalShape === 'trapez') {
        const sideA = (data.sideA || 8) * scale;
        const sideB = (data.sideB || 6) * scale;
        const height = (data.height || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideB/2, y: CANVAS_CENTER_Y - height/2 },
            { x: CANVAS_CENTER_X - sideB/2, y: CANVAS_CENTER_Y - height/2 }
        ];
    }
    
    // Parallelogramm
    else if (finalShape === 'parallelogramm') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const angle = (data.angle || 75) * Math.PI / 180;
        const offset = width * Math.cos(angle);
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X + length/2 + offset, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X - length/2 + offset, y: CANVAS_CENTER_Y - width/2 }
        ];
    }
    
    // Rhombus
    else if (finalShape === 'rhombus') {
        const diagonal1 = (data.diagonal1 || 6) * scale;
        const diagonal2 = (data.diagonal2 || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - diagonal2/2 },
            { x: CANVAS_CENTER_X + diagonal1/2, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + diagonal2/2 },
            { x: CANVAS_CENTER_X - diagonal1/2, y: CANVAS_CENTER_Y }
        ];
    }
    
    // Vielecke
    else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        const radius = (data.radius || 3) * scale;
        const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
    }
    
    // L-Form
    else if (finalShape === 'lform') {
        const length1 = (data.length1 || 8) * scale;
        const width1 = (data.width1 || 3) * scale;
        const length2 = (data.length2 || 5) * scale;
        const width2 = (data.width2 || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length1/2, y: CANVAS_CENTER_Y - width1/2 },
            { x: CANVAS_CENTER_X - length1/2 + length2, y: CANVAS_CENTER_Y - width1/2 },
            { x: CANVAS_CENTER_X - length1/2 + length2, y: CANVAS_CENTER_Y - width1/2 + width2 },
            { x: CANVAS_CENTER_X + length1/2, y: CANVAS_CENTER_Y - width1/2 + width2 },
            { x: CANVAS_CENTER_X + length1/2, y: CANVAS_CENTER_Y + width1/2 },
            { x: CANVAS_CENTER_X - length1/2, y: CANVAS_CENTER_Y + width1/2 }
        ];
    }
    
    // T-Form
    else if (finalShape === 'tform') {
        const headWidth = (data.headWidth || 8) * scale;
        const headHeight = (data.headHeight || 2) * scale;
        const stemWidth = (data.stemWidth || 3) * scale;
        const stemHeight = (data.stemHeight || 5) * scale;
        const totalHeight = headHeight + stemHeight;
        corners = [
            { x: CANVAS_CENTER_X - headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 },
            { x: CANVAS_CENTER_X + headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 },
            { x: CANVAS_CENTER_X + headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X + stemWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X + stemWidth/2, y: CANVAS_CENTER_Y + totalHeight/2 },
            { x: CANVAS_CENTER_X - stemWidth/2, y: CANVAS_CENTER_Y + totalHeight/2 },
            { x: CANVAS_CENTER_X - stemWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X - headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight }
        ];
    }
    
    // U-Form
    else if (finalShape === 'uform') {
        const outerWidth = (data.outerWidth || 8) * scale;
        const outerHeight = (data.outerHeight || 6) * scale;
        const innerWidth = (data.innerWidth || 4) * scale;
        const innerHeight = (data.innerHeight || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - outerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 },
            { x: CANVAS_CENTER_X + outerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 },
            { x: CANVAS_CENTER_X + outerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X + innerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X + innerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 + (outerHeight - innerHeight) },
            { x: CANVAS_CENTER_X - innerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 + (outerHeight - innerHeight) },
            { x: CANVAS_CENTER_X - innerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X - outerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 }
        ];
    }
    
    // Fallback: Rechteck
    else {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    
    // Rotation anwenden
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
    
    if (finalShape === 'dreieck' && corners.length >= 3) {
        // Seite A (zwischen Punkt 1 und 2)
        const sideAMidX = (corners[1].x + corners[2].x) / 2;
        const sideAMidY = (corners[1].y + corners[2].y) / 2;
        const sideALabel = createLabel(sideAMidX, sideAMidY + 15, 'A', '#dc3545');
        group.appendChild(sideALabel);
        
        // Seite B (zwischen Punkt 0 und 1)
        const sideBMidX = (corners[0].x + corners[1].x) / 2;
        const sideBMidY = (corners[0].y + corners[1].y) / 2;
        const sideBLabel = createLabel(sideBMidX - 15, sideBMidY, 'B', '#28a745');
        group.appendChild(sideBLabel);
        
        // Seite C (zwischen Punkt 0 und 2)
        const sideCMidX = (corners[0].x + corners[2].x) / 2;
        const sideCMidY = (corners[0].y + corners[2].y) / 2;
        const sideCLabel = createLabel(sideCMidX + 15, sideCMidY, 'C', '#ffc107');
        group.appendChild(sideCLabel);
        
    } else if (corners.length >= 4 && ['quadrat', 'rechteck', 'trapez', 'parallelogramm', 'rhombus'].includes(finalShape)) {
        // Viereck-Labels
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        const offsets = [
            { x: 0, y: -12 },   // A oben
            { x: 12, y: 0 },    // B rechts
            { x: 0, y: 15 },    // C unten
            { x: -12, y: 0 }    // D links
        ];
        
        for (let i = 0; i < Math.min(4, corners.length); i++) {
            const nextI = (i + 1) % corners.length;
            const midX = (corners[i].x + corners[nextI].x) / 2;
            const midY = (corners[i].y + corners[nextI].y) / 2;
            const label = createLabel(midX + offsets[i].x, midY + offsets[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (['kreis', 'oval'].includes(finalShape)) {
        // Radius-Labels für Kreisformen
        const label = createLabel(CANVAS_CENTER_X + 15, CANVAS_CENTER_Y - 15, 'R', '#007bff');
        group.appendChild(label);
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
    const scale = calculateDynamicScale(data);
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
    const scale = calculateDynamicScale(data);
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
    const variant = determineActualVariant();
    
    // KORRIGIERT: Berechnungen für alle Formen
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            area = Math.PI * radiusX * radiusY;
            perimeter = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY)));
            break;
        case 'halbkreis':
            const halfRadius = data.radius || 4;
            area = (Math.PI * halfRadius * halfRadius) / 2;
            perimeter = Math.PI * halfRadius + 2 * halfRadius;
            break;
        case 'viertelkreis':
            const quarterRadius = data.radius || 5;
            area = (Math.PI * quarterRadius * quarterRadius) / 4;
            perimeter = (Math.PI * quarterRadius) / 2 + 2 * quarterRadius;
            break;
        case 'langloch':
            const length = data.length || 8;
            const width = data.width || 3;
            const r = width / 2;
            area = (length - width) * width + Math.PI * r * r;
            perimeter = 2 * (length - width) + 2 * Math.PI * r;
            break;
        case 'rechteck':
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            area = rectLength * rectWidth;
            perimeter = 2 * (rectLength + rectWidth);
            break;
        case 'quadrat':
            const side = data.side || 5;
            area = side * side;
            perimeter = 4 * side;
            break;
        case 'dreieck':
            if (variant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                const c = Math.sqrt(a*a + b*b);
                perimeter = a + b + c;
            } else if (variant === 'gleichseitig') {
                const s = data.side || 6;
                area = (Math.sqrt(3) / 4) * s * s;
                perimeter = 3 * s;
            } else {
                const a = data.sideA || 4;
                const b = data.sideB || 5;
                const c = data.sideC || 6;
                const s = (a + b + c) / 2;
                area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                perimeter = a + b + c;
            }
            break;
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            area = ((sideA + sideB) / 2) * height;
            // Vereinfachte Umfang-Berechnung
            const sideLength = Math.sqrt(height * height + ((sideA - sideB) / 2) * ((sideA - sideB) / 2));
            perimeter = sideA + sideB + 2 * sideLength;
            break;
        case 'parallelogramm':
            const pLength = data.length || 8;
            const pWidth = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            area = pLength * pWidth * Math.sin(angle);
            perimeter = 2 * (pLength + pWidth);
            break;
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            area = (d1 * d2) / 2;
            const rhombusSide = Math.sqrt((d1/2) * (d1/2) + (d2/2) * (d2/2));
            perimeter = 4 * rhombusSide;
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            area = (n * polyRadius * polyRadius * Math.sin(2 * Math.PI / n)) / 2;
            perimeter = n * 2 * polyRadius * Math.sin(Math.PI / n);
            break;
        case 'lform':
            const l1 = data.length1 || 8;
            const w1 = data.width1 || 3;
            const l2 = data.length2 || 5;
            const w2 = data.width2 || 4;
            area = l1 * w1 + l2 * w2 - (l2 * w1); // Überlappung abziehen
            perimeter = 2 * (l1 + w1 + l2 + w2) - 2 * Math.min(l2, w1);
            break;
        case 'tform':
            const headW = data.headWidth || 8;
            const headH = data.headHeight || 2;
            const stemW = data.stemWidth || 3;
            const stemH = data.stemHeight || 5;
            area = headW * headH + stemW * stemH;
            perimeter = 2 * (headW + headH + stemW + stemH) - 2 * stemW;
            break;
        case 'uform':
            const outerW = data.outerWidth || 8;
            const outerH = data.outerHeight || 6;
            const innerW = data.innerWidth || 4;
            const innerH = data.innerHeight || 4;
            area = outerW * outerH - innerW * innerH;
            perimeter = 2 * (outerW + outerH + innerW + innerH);
            break;
        default:
            // Fallback
            area = 40;
            perimeter = 26;
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
        // Setze Standard-Werte basierend auf der Form
        const finalShape = determineActualShape();
        switch(input.id) {
            case 'radius': input.value = '3'; break;
            case 'radiusX': input.value = '4'; break;
            case 'radiusY': input.value = '2.5'; break;
            case 'side': 
                input.value = finalShape === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'height': input.value = '4'; break;
            case 'angle': input.value = '75'; break;
            case 'diagonal1': input.value = '6'; break;
            case 'diagonal2': input.value = '4'; break;
            case 'length1': input.value = '8'; break;
            case 'width1': input.value = '3'; break;
            case 'length2': input.value = '5'; break;
            case 'width2': input.value = '4'; break;
            case 'headWidth': input.value = '8'; break;
            case 'headHeight': input.value = '2'; break;
            case 'stemWidth': input.value = '3'; break;
            case 'stemHeight': input.value = '5'; break;
            case 'outerWidth': input.value = '8'; break;
            case 'outerHeight': input.value = '6'; break;
            case 'innerWidth': input.value = '4'; break;
            case 'innerHeight': input.value = '4'; break;
        }
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
    
    console.log('Speichere Daten:', projectData);
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

// KORRIGIERT: Erweiterte Punkt-Generierung für alle Formen
function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let points = [];
    
    console.log('Generiere Punkte für:', finalShape, variant);
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radiusX * Math.cos(angle),
                    y: radiusY * Math.sin(angle)
                });
            }
            break;
        case 'dreieck':
            if (variant === 'gleichseitig') {
                const side = data.side || 6;
                const height = side * Math.sqrt(3) / 2;
                points = [
                    { x: 0, y: height * 2/3 },
                    { x: -side/2, y: -height/3 },
                    { x: side/2, y: -height/3 }
                ];
            } else if (variant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                points = [
                    { x: -a/2, y: -b/3 },
                    { x: a/2, y: -b/3 },
                    { x: -a/2, y: b*2/3 }
                ];
            } else {
                const sideA = data.sideA || 4;
                points = [
                    { x: 0, y: 3 },
                    { x: -sideA/2, y: -2 },
                    { x: sideA/2, y: -2 }
                ];
            }
            break;
        case 'quadrat':
            const side = data.side || 5;
            points = [
                { x: -side/2, y: -side/2 }, { x: side/2, y: -side/2 },
                { x: side/2, y: side/2 }, { x: -side/2, y: side/2 }
            ];
            break;
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            points = [
                { x: -sideA/2, y: -height/2 },
                { x: sideA/2, y: -height/2 },
                { x: sideB/2, y: height/2 },
                { x: -sideB/2, y: height/2 }
            ];
            break;
        case 'parallelogramm':
            const length = data.length || 8;
            const width = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            const offset = width * Math.cos(angle);
            points = [
                { x: -length/2, y: -width/2 },
                { x: length/2, y: -width/2 },
                { x: length/2 + offset, y: width/2 },
                { x: -length/2 + offset, y: width/2 }
            ];
            break;
        case 'rhombus':
            const diagonal1 = data.diagonal1 || 6;
            const diagonal2 = data.diagonal2 || 4;
            points = [
                { x: 0, y: -diagonal2/2 },
                { x: diagonal1/2, y: 0 },
                { x: 0, y: diagonal2/2 },
                { x: -diagonal1/2, y: 0 }
            ];
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            for (let i = 0; i < n; i++) {
                const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                points.push({
                    x: polyRadius * Math.cos(angle),
                    y: polyRadius * Math.sin(angle)
                });
            }
            break;
        case 'lform':
            const length1 = data.length1 || 8;
            const width1 = data.width1 || 3;
            const length2 = data.length2 || 5;
            const width2 = data.width2 || 4;
            points = [
                { x: -length1/2, y: -width1/2 },
                { x: -length1/2 + length2, y: -width1/2 },
                { x: -length1/2 + length2, y: -width1/2 + width2 },
                { x: length1/2, y: -width1/2 + width2 },
                { x: length1/2, y: width1/2 },
                { x: -length1/2, y: width1/2 }
            ];
            break;
        case 'tform':
            const headWidth = data.headWidth || 8;
            const headHeight = data.headHeight || 2;
            const stemWidth = data.stemWidth || 3;
            const stemHeight = data.stemHeight || 5;
            const totalHeight = headHeight + stemHeight;
            points = [
                { x: -headWidth/2, y: totalHeight/2 },
                { x: headWidth/2, y: totalHeight/2 },
                { x: headWidth/2, y: totalHeight/2 - headHeight },
                { x: stemWidth/2, y: totalHeight/2 - headHeight },
                { x: stemWidth/2, y: -totalHeight/2 },
                { x: -stemWidth/2, y: -totalHeight/2 },
                { x: -stemWidth/2, y: totalHeight/2 - headHeight },
                { x: -headWidth/2, y: totalHeight/2 - headHeight }
            ];
            break;
        case 'uform':
            const outerWidth = data.outerWidth || 8;
            const outerHeight = data.outerHeight || 6;
            const innerWidth = data.innerWidth || 4;
            const innerHeight = data.innerHeight || 4;
            points = [
                { x: -outerWidth/2, y: -outerHeight/2 },
                { x: outerWidth/2, y: -outerHeight/2 },
                { x: outerWidth/2, y: outerHeight/2 },
                { x: innerWidth/2, y: outerHeight/2 },
                { x: innerWidth/2, y: -outerHeight/2 + (outerHeight - innerHeight) },
                { x: -innerWidth/2, y: -outerHeight/2 + (outerHeight - innerHeight) },
                { x: -innerWidth/2, y: outerHeight/2 },
                { x: -outerWidth/2, y: outerHeight/2 }
            ];
            break;
        case 'halbkreis':
            const halfRadius = data.radius || 4;
            for (let i = 0; i <= 8; i++) {
                const angle = (i * Math.PI) / 8;
                points.push({
                    x: halfRadius * Math.cos(angle),
                    y: halfRadius * Math.sin(angle)
                });
            }
            break;
        case 'viertelkreis':
            const quarterRadius = data.radius || 5;
            points = [{ x: 0, y: 0 }];
            for (let i = 0; i <= 4; i++) {
                const angle = (i * Math.PI / 2) / 4;
                points.push({
                    x: quarterRadius * Math.cos(angle),
                    y: quarterRadius * Math.sin(angle)
                });
            }
            break;
        case 'langloch':
            const langLength = data.length || 8;
            const langWidth = data.width || 3;
            const radius = langWidth / 2;
            const straightLength = langLength - langWidth;
            // Vereinfacht als Rechteck mit abgerundeten Enden
            points = [
                { x: -langLength/2, y: -langWidth/2 },
                { x: langLength/2, y: -langWidth/2 },
                { x: langLength/2, y: langWidth/2 },
                { x: -langLength/2, y: langWidth/2 }
            ];
            break;
        default:
            // Fallback: Rechteck
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            points = [
                { x: -rectLength/2, y: -rectWidth/2 }, { x: rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: rectWidth/2 }, { x: -rectLength/2, y: rectWidth/2 }
            ];
    }
    
    console.log('Generierte Punkte:', points);
    return points;
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            return Math.PI * radius * radius;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            return Math.PI * radiusX * radiusY;
        case 'halbkreis':
            const halfRadius = data.radius || 4;
            return (Math.PI * halfRadius * halfRadius) / 2;
        case 'viertelkreis':
            const quarterRadius = data.radius || 5;
            return (Math.PI * quarterRadius * quarterRadius) / 4;
        case 'langloch':
            const length = data.length || 8;
            const width = data.width || 3;
            const r = width / 2;
            return (length - width) * width + Math.PI * r * r;
        case 'rechteck':
            return (data.length || 8) * (data.width || 5);
        case 'quadrat':
            const side = data.side || 5;
            return side * side;
        case 'dreieck':
            if (variant === 'rechtwinklig') {
                return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
            } else if (variant === 'gleichseitig') {
                const s = data.side || 6;
                return (Math.sqrt(3) / 4) * s * s;
            } else {
                // Heron'sche Formel
                const a = data.sideA || 4;
                const b = data.sideB || 5;
                const c = data.sideC || 6;
                const s = (a + b + c) / 2;
                return Math.sqrt(s * (s - a) * (s - b) * (s - c));
            }
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            return ((sideA + sideB) / 2) * height;
        case 'parallelogramm':
            const pLength = data.length || 8;
            const pWidth = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            return pLength * pWidth * Math.sin(angle);
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            return (d1 * d2) / 2;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            return (n * polyRadius * polyRadius * Math.sin(2 * Math.PI / n)) / 2;
        case 'lform':
            const l1 = data.length1 || 8;
            const w1 = data.width1 || 3;
            const l2 = data.length2 || 5;
            const w2 = data.width2 || 4;
            return l1 * w1 + l2 * w2 - Math.min(l2, w1) * Math.min(l1, w2);
        case 'tform':
            const headW = data.headWidth || 8;
            const headH = data.headHeight || 2;
            const stemW = data.stemWidth || 3;
            const stemH = data.stemHeight || 5;
            return headW * headH + stemW * stemH;
        case 'uform':
            const outerW = data.outerWidth || 8;
            const outerH = data.outerHeight || 6;
            const innerW = data.innerWidth || 4;
            const innerH = data.innerHeight || 4;
            return outerW * outerH - innerW * innerH;
        default:
            return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            return { length: radius * 2, width: radius * 2 };
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            return { length: radiusX * 2, width: radiusY * 2 };
        case 'rechteck':
            return { length: data.length || 8, width: data.width || 5 };
        case 'quadrat':
            const side = data.side || 5;
            return { length: side, width: side };
        case 'trapez':
            const sideA = data.sideA || 8;
            const height = data.height || 4;
            return { length: sideA, width: height };
        case 'parallelogramm':
            return { length: data.length || 8, width: data.width || 5 };
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            return { length: d1, width: d2 };
        default:
            return { length: 8, width: 5 };
    }
}

console.log('Korrigierte Editor.js mit vollständiger Formen-Unterstützung geladen');// Editor.js - KORRIGIERT für alle Dachformen

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
            console.log('Editor erfolgreich initialisiert');
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

    console.log('Geladene roofShape-Daten:', projectData.roofShape);
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
    
    // KORRIGIERT: Vollständige Mapping-Tabelle für alle Formen
    const shapeNames = {
        // Kreisformen
        'kreis': 'Kreis',
        'oval': 'Oval', 
        'halbkreis': 'Halbkreis',
        'viertelkreis': 'Viertelkreis',
        'langloch': 'Langloch',
        
        // Dreiecke
        'dreieck': 'Dreieck',
        'gleichseitig': 'Gleichseitiges Dreieck',
        'rechtwinklig': 'Rechtwinkliges Dreieck', 
        'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        
        // Vierecke
        'viereck': 'Viereck',
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat',
        'parallelogramm': 'Parallelogramm',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        
        // Vielecke  
        'vieleck': 'Vieleck',
        'fuenfeck': 'Fünfeck',
        'sechseck': 'Sechseck', 
        'achteck': 'Achteck',
        'lform': 'L-Form',
        'tform': 'T-Form',
        'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    console.log('Shape-Mapping:', {
        baseShape: roofShape.baseShape,
        variant: roofShape.variant, 
        resultName: shapeName
    });
    
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
    
    console.log('Lade Form:', { currentShape, currentVariant });
    
    createInputFields();
    updateShape();
}

// KORRIGIERT: Erweiterte Shape-Bestimmung
function determineActualShape() {
    console.log('determineActualShape - Input:', { currentShape, currentVariant });
    
    // Spezialfall: Wenn variant direkt eine Shape ist
    if (currentVariant === 'quadrat') return 'quadrat';
    if (currentVariant === 'trapez') return 'trapez';
    if (currentVariant === 'parallelogramm') return 'parallelogramm';
    if (currentVariant === 'rhombus') return 'rhombus';
    
    // Kreisformen
    if (currentShape === 'kreis') {
        if (['oval', 'halbkreis', 'viertelkreis', 'langloch'].includes(currentVariant)) {
            return currentVariant;
        }
        return 'kreis';
    }
    
    // Dreiecke
    if (currentShape === 'dreieck') {
        if (['gleichseitig', 'rechtwinklig', 'ungleichschenklig'].includes(currentVariant)) {
            return 'dreieck';
        }
        return 'dreieck';
    }
    
    // Vielecke
    if (currentShape === 'vieleck') {
        if (['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform'].includes(currentVariant)) {
            return currentVariant;
        }
        return 'fuenfeck'; // Default
    }
    
    // Fallback zu Rechteck
    const result = currentShape || 'rechteck';
    console.log('determineActualShape - Result:', result);
    return result;
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

// KORRIGIERT: Erweiterte Input-Felder für alle Formen
function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log('Creating inputs for:', { finalShape, variant });
    
    // Kreisformen
    if (finalShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'oval') {
        container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '4'));
        container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '2.5'));
    } else if (finalShape === 'halbkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    } else if (finalShape === 'viertelkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
    } else if (finalShape === 'langloch') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
    }
    
    // Dreiecke
    else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        } else if (variant === 'rechtwinklig') {
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
        } else {
            container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
        }
    }
    
    // Quadrat
    else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    }
    
    // Trapez
    else if (finalShape === 'trapez') {
        container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    }
    
    // Parallelogramm
    else if (finalShape === 'parallelogramm') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '75'));
    }
    
    // Rhombus
    else if (finalShape === 'rhombus') {
        container.appendChild(createInput('Diagonale 1 (m)', 'diagonal1', savedData.diagonal1 || '6'));
        container.appendChild(createInput('Diagonale 2 (m)', 'diagonal2', savedData.diagonal2 || '4'));
    }
    
    // Vielecke
    else if (finalShape === 'fuenfeck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'sechseck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'achteck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'lform') {
        container.appendChild(createInput('Länge 1 (m)', 'length1', savedData.length1 || '8'));
        container.appendChild(createInput('Breite 1 (m)', 'width1', savedData.width1 || '3'));
        container.appendChild(createInput('Länge 2 (m)', 'length2', savedData.length2 || '5'));
        container.appendChild(createInput('Breite 2 (m)', 'width2', savedData.width2 || '4'));
    } else if (finalShape === 'tform') {
        container.appendChild(createInput('Breite Kopf (m)', 'headWidth', savedData.headWidth || '8'));
        container.appendChild(createInput('Höhe Kopf (m)', 'headHeight', savedData.headHeight || '2'));
        container.appendChild(createInput('Breite Stamm (m)', 'stemWidth', savedData.stemWidth || '3'));
        container.appendChild(createInput('Höhe Stamm (m)', 'stemHeight', savedData.stemHeight || '5'));
    } else if (finalShape === 'uform') {
        container.appendChild(createInput('Außenbreite (m)', 'outerWidth', savedData.outerWidth || '8'));
        container.appendChild(createInput('Außenhöhe (m)', 'outerHeight', savedData.outerHeight || '6'));
        container.appendChild(createInput('Innenbreite (m)', 'innerWidth', savedData.innerWidth || '4'));
        container.appendChild(createInput('Innenhöhe (m)', 'innerHeight', savedData.innerHeight || '4'));
    }
    
    // Fallback: Rechteck
    else {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
    
    console.log('Input-Felder erstellt für:', finalShape);
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
    unit.textContent = id.includes('angle') ? '°' : 'm';
    
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
    const newScale = calculateDynamicScale(data);
    
    updateShapeWithScale(newScale);
    
    setTimeout(() => { isUpdating = false; }, 50);
}

function calculateDynamicScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    let maxDimension = 0;
    
    // KORRIGIERT: Berücksichtige alle Formen
    if (finalShape === 'kreis' || finalShape === 'fuenfeck' || finalShape === 'sechseck' || finalShape === 'achteck') {
        maxDimension = (data.radius || 3) * 2;
    } else if (finalShape === 'oval') {
        maxDimension = Math.max((data.radiusX || 4) * 2, (data.radiusY || 2.5) * 2);
    } else if (finalShape === 'halbkreis' || finalShape === 'viertelkreis') {
        maxDimension = (data.radius || 4) * 2;
    } else if (finalShape === 'langloch') {
        maxDimension = Math.max(data.length || 8, data.width || 3);
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
    } else if (finalShape === 'trapez') {
        maxDimension = Math.max(data.sideA || 8, data.sideB || 6, data.height || 4);
    } else if (finalShape === 'parallelogramm') {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    } else if (finalShape === 'rhombus') {
        maxDimension = Math.max(data.diagonal1 || 6, data.diagonal2 || 4);
    } else if (finalShape === 'lform') {
        maxDimension = Math.max(data.length1 || 8, data.width1 || 3, data.length2 || 5, data.width2 || 4);
    } else if (finalShape === 'tform') {
        maxDimension = Math.max(data.headWidth || 8, data.headHeight + data.stemHeight || 7);
    } else if (finalShape === 'uform') {
        maxDimension = Math.max(data.outerWidth || 8, data.outerHeight || 6);
    } else {
        // Rechteck
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    const availableSpace = Math.min(500, 300);
    let scale = (availableSpace * 0.7) / maxDimension;
    
    scale = Math.max(scale, 15);
    scale = Math.min(scale, 120);
    
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
    updateShapeWithScale(SCALE_FACTOR);
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant };
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

// KORRIGIERT: Erweiterte Shape-Zeichnung für alle Formen
function drawCurrentShape(group, data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    
    console.log('Zeichne Form:', finalShape, 'mit Daten:', data);
    
    // Kreisformen
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'oval') {
        drawOvalShape(group, data, scale);
    } else if (finalShape === 'halbkreis') {
        drawHalfCircleShape(group, data, scale);
    } else if (finalShape === 'viertelkreis') {
        drawQuarterCircleShape(group, data, scale);
    } else if (finalShape === 'langloch') {
        drawLanglochShape(group, data, scale);
    }
    
    // Dreiecke
    else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    }
    
    // Vierecke
    else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else if (finalShape === 'parallelogramm') {
        drawParallelogrammShape(group, data, scale);
    } else if (finalShape === 'rhombus') {
        drawRhombusShape(group, data, scale);
    }
    
    // Vielecke
    else if (finalShape === 'fuenfeck') {
        drawPolygonShape(group, data, scale, 5);
    } else if (finalShape === 'sechseck') {
        drawPolygonShape(group, data, scale, 6);
    } else if (finalShape === 'achteck') {
        drawPolygonShape(group, data, scale, 8);
    } else if (finalShape === 'lform') {
        drawLShape(group, data, scale);
    } else if (finalShape === 'tform') {
        drawTShape(group, data, scale);
    } else if (finalShape === 'uform') {
        drawUShape(group, data, scale);
    }
    
    // Fallback: Rechteck
    else {
        drawRectangleShape(group, data, scale);
    }
    
    // Rotation anwenden
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

// Neue Zeichenfunktionen für alle Formen
function drawCircleShape(group, data, scale) {
    const radius = (data.radius || 3) * scale;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '3');
    group.appendChild(circle);
}

function drawOvalShape(group, data, scale) {
    const radiusX = (data.radiusX || 4) * scale;
    const radiusY = (data.radiusY || 2.5) * scale;
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', CANVAS_CENTER_X);
    ellipse.setAttribute('cy', CANVAS_CENTER_Y);
    ellipse.setAttribute('rx', radiusX);
    ellipse.setAttribute('ry', radiusY);
    ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    ellipse.setAttribute('stroke', '#007bff');
    ellipse.setAttribute('stroke-width', '3');
    group.appendChild(ellipse);
}

function drawHalfCircleShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const d = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawQuarterCircleShape(group, data, scale) {
    const radius = (data.radius || 5) * scale;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const d = `M ${centerX} ${centerY} L ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 0 ${centerX} ${centerY - radius} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawLanglochShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 3) * scale;
    const radius = width / 2;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const halfLength = length / 2 - radius;
    
    const d = `
        M ${centerX - halfLength} ${centerY - radius}
        L ${centerX + halfLength} ${centerY - radius}
        A ${radius} ${radius} 0 0 1 ${centerX + halfLength} ${centerY + radius}
        L ${centerX - halfLength} ${centerY + radius}
        A ${radius} ${radius} 0 0 1 ${centerX - halfLength} ${centerY - radius} Z
    `;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;
    const sideB = (data.sideB || 6) * scale;
    const height = (data.height || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const offsetA = (sideA - sideB) / 4;
    
    const points = `
        ${centerX - sideA/2},${centerY + height/2}
        ${centerX + sideA/2},${centerY + height/2}
        ${centerX + sideB/2},${centerY - height/2}
        ${centerX - sideB/2},${centerY - height/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawParallelogrammShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    const angle = (data.angle || 75) * Math.PI / 180;
    const offset = width * Math.cos(angle);
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - length/2},${centerY + width/2}
        ${centerX + length/2},${centerY + width/2}
        ${centerX + length/2 + offset},${centerY - width/2}
        ${centerX - length/2 + offset},${centerY - width/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawRhombusShape(group, data, scale) {
    const diagonal1 = (data.diagonal1 || 6) * scale;
    const diagonal2 = (data.diagonal2 || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX},${centerY - diagonal2/2}
        ${centerX + diagonal1/2},${centerY}
        ${centerX},${centerY + diagonal2/2}
        ${centerX - diagonal1/2},${centerY}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawPolygonShape(group, data, scale, sides) {
    const radius = (data.radius || 3) * scale;
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    let points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawLShape(group, data, scale) {
    const length1 = (data.length1 || 8) * scale;
    const width1 = (data.width1 || 3) * scale;
    const length2 = (data.length2 || 5) * scale;
    const width2 = (data.width2 || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - length1/2},${centerY - width1/2}
        ${centerX - length1/2 + length2},${centerY - width1/2}
        ${centerX - length1/2 + length2},${centerY - width1/2 + width2}
        ${centerX + length1/2},${centerY - width1/2 + width2}
        ${centerX + length1/2},${centerY + width1/2}
        ${centerX - length1/2},${centerY + width1/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawTShape(group, data, scale) {
    const headWidth = (data.headWidth || 8) * scale;
    const headHeight = (data.headHeight || 2) * scale;
    const stemWidth = (data.stemWidth || 3) * scale;
    const stemHeight = (data.stemHeight || 5) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const totalHeight = headHeight + stemHeight;
    
    const points = `
        ${centerX - headWidth/2},${centerY - totalHeight/2}
        ${centerX + headWidth/2},${centerY - totalHeight/2}
        ${centerX + headWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX + stemWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX + stemWidth/2},${centerY + totalHeight/2}
        ${centerX - stemWidth/2},${centerY + totalHeight/2}
        ${centerX - stemWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX - headWidth/2},${centerY - totalHeight/2 + headHeight}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawUShape(group, data, scale) {
    const outerWidth = (data.outerWidth || 8) * scale;
    const outerHeight = (data.outerHeight || 6) * scale;
    const innerWidth = (data.innerWidth || 4) * scale;
    const innerHeight = (data.innerHeight || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const wallThickness = (outerWidth - innerWidth) / 2;
    
    const points = `
        ${centerX - outerWidth/2},${centerY - outerHeight/2}
        ${centerX + outerWidth/2},${centerY - outerHeight/2}
        ${centerX + outerWidth/2},${centerY + outerHeight/2}
        ${centerX + innerWidth/2},${centerY + outerHeight/2}
        ${centerX + innerWidth/2},${centerY - outerHeight/2 + (outerHeight - innerHeight)}
        ${centerX - innerWidth/2},${centerY - outerHeight/2 + (outerHeight - innerHeight)}
        ${centerX - innerWidth/2},${centerY + outerHeight/2}
        ${centerX - outerWidth/2},${centerY + outerHeight/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}
