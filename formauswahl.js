// KORRIGIERTE Bemaßung-SVG generieren mit vergrößerten Koordinaten (1000x1000)
    function getDimensionsSVG() {
        var dims = currentDimensions;
        var scale = 100; // VERGRÖSSERT von 80 auf 100 (passend zur Form)
        var offset = 150; // VERGRÖSSERT von 120 auf 150 für noch mehr Abstand
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                
                return [
                    // Untere Basis - Maßlinie
                    '<line x1="' + (500-bottomBase/2) + '" y1="' + (500+height/2+offset) + '" x2="' + (500+bottomBase/2) + '" y2="' + (500+height/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Untere Basis - Text
                    '<text x="500" y="' + (500+height/2+offset+25) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">' + (dims.bottomBase || 8) + 'm</text>',
                    // Untere Basis - Verbindungslinien
                    '<line x1="' + (500-bottomBase/2) + '" y1="' + (500+height/2) + '" x2="' + (500-bottomBase/2) + '" y2="' + (500+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500+bottomBase/2) + '" y1="' + (500+height/2) + '" x2="' + (500+bottomBase/2) + '" y2="' + (500+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Obere Basis - Maßlinie
                    '<line x1="' + (500-topBase/2) + '" y1="' + (500-height/2-offset) + '" x2="' + (500+topBase/2) + '" y2="' + (500-height/2-offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Obere Basis - Text
                    '<text x="500" y="' + (500-height/2-offset-10) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">' + (dims.topBase || 6) + 'm</text>',
                    // Obere Basis - Verbindungslinien
                    '<line x1="' + (500-topBase/2) + '" y1="' + (500-height/2) + '" x2="' + (500-topBase/2) + '" y2="' + (500-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500+topBase/2) + '" y1="' + (500-height/2) + '" x2="' + (500+topBase/2) + '" y2="' + (500-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Höhe - Maßlinie
                    '<line x1="' + (500-bottomBase/2-offset) + '" y1="' + (500-height/2) + '" x2="' + (500-bottomBase/2-offset) + '" y2="' + (500+height/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Höhe - Text (gedreht)
                    '<text x="' + (500-bottomBase/2-offset-25) + '" y="500" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-bottomBase/2-offset-25) + ' 500)">' + (dims.height || 4) + 'm</text>',
                    // Höhe - Verbindungslinien
                    '<line x1="' + (500-bottomBase/2) + '" y1="' + (500-height/2) + '" x2="' + (500-bottomBase/2-offset) + '" y2="' + (500-height/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500-bottomBase/2) + '" y1="' + (500+height/2) + '" x2="' + (500-bottomBase/2-offset) + '" y2="' + (500+height/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                
                return [
                    // Länge - Maßlinie
                    '<line x1="' + (500-length/2) + '" y1="' + (500+width/2+offset) + '" x2="' + (500+length/2) + '" y2="' + (500+width/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Länge - Text
                    '<text x="500" y="' + (500+width/2+offset+25) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">' + (dims.length || 8) + 'm</text>',
                    // Länge - Verbindungslinien
                    '<line x1="' + (500-length/2) + '" y1="' + (500+width/2) + '" x2="' + (500-length/2) + '" y2="' + (500+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500+length/2) + '" y1="' + (500+width/2) + '" x2="' + (500+length/2) + '" y2="' + (500+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Breite - Maßlinie
                    '<line x1="' + (500-length/2-offset) + '" y1="' + (500-width/2) + '" x2="' + (500-length/2-offset) + '" y2="' + (500+width/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Breite - Text (gedreht)
                    '<text x="' + (500-length/2-offset-25) + '" y="500" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-length/2-offset-25) + ' 500)">' + (dims.width || 5) + 'm</text>',
                    // Breite - Verbindungslinien
                    '<line x1="' + (500-length/2) + '" y1="' + (500-width/2) + '" x2="' + (500-length/2-offset) + '" y2="' + (500-width/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500-length/2) + '" y1="' + (500+width/2) + '" x2="' + (500-length/2-offset) + '" y2="' + (500+width/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale;
                
                return [
                    // Radius - Linie von Zentrum nach außen
                    '<line x1="500" y1="500" x2="' + (500+radius) + '" y2="500" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrowhead)"/>',
                    // Radius - Text
                    '<text x="' + (500+radius/2) + '" y="485" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">r = ' + (dims.radius || 4) + 'm</text>',
                    
                    // Durchmesser - Maßlinie unten
                    '<line x1="' + (500-radius) + '" y1="' + (500+radius+offset) + '" x2="' + (500+radius) + '" y2="' + (500+radius+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Durchmesser - Text
                    '<text x="500" y="' + (500+radius+offset+25) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">⌀ ' + ((dims.radius || 4) * 2) + 'm</text>',
                    // Durchmesser - Verbindungslinien
                    '<line x1="' + (500-radius) + '" y1="' + (500+radius) + '" x2="' + (500-radius) + '" y2="' + (500+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500+radius) + '" y1="' + (500+radius) + '" x2="' + (500+radius) + '" y2="' + (500+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Zentrum markieren
                    '<circle cx="500" cy="500" r="5" fill="#ff6b6b"/>',
                    '<text x="515" y="525" font-size="14" fill="#ff6b6b">Zentrum</text>'
                ].join('');
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                
                return [
                    // Kathete A - Maßlinie (horizontal)
                    '<line x1="500" y1="' + (500+offset+50) + '" x2="' + (500+katheteA) + '" y2="' + (500+offset+50) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete A - Text
                    '<text x="' + (500+katheteA/2) + '" y="' + (500+offset+75) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">' + (dims.katheteA || 4) + 'm</text>',
                    // Kathete A - Verbindungslinien
                    '<line x1="500" y1="500" x2="500" y2="' + (500+offset+50) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (500+katheteA) + '" y1="500" x2="' + (500+katheteA) + '" y2="' + (500+offset+50) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Kathete B - Maßlinie (vertikal)
                    '<line x1="' + (500-offset-50) + '" y1="500" x2="' + (500-offset-50) + '" y2="' + (500-katheteB) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete B - Text (gedreht)
                    '<text x="' + (500-offset-75) + '" y="' + (500-katheteB/2) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-offset-75) + ' ' + (500-katheteB/2) + ')">' + (dims.katheteB || 5) + 'm</text>',
                    // Kathete B - Verbindungslinien
                    '<line x1="500" y1="500" x2="' + (500-offset-50) + '" y2="500" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="500" y1="' + (500-katheteB) + '" x2="' + (500-offset-50) + '" y2="' + (500-katheteB) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Rechter Winkel Symbol (vergrößert)
                    '<path d="M ' + (500+40) + ' 500 L ' + (500+40) + ' ' + (500-40) + ' L 500 ' + (500-40) + '" stroke="#007bff" stroke-width="5" fill="none"/>',
                    '<text x="' + (500+50) + '" y="' + (500-50) + '" font-size="18" fill="#007bff">90°</text>'
                ].join('');
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                return [
                    // Gesamtlänge - Maßlinie
                    '<line x1="' + (500-totalLength/2) + '" y1="' + (500+totalWidth/2+offset) + '" x2="' + (500+totalLength/2) + '" y2="' + (500+totalWidth/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtlänge - Text
                    '<text x="500" y="' + (500+totalWidth/2+offset+25) + '" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b">' + (dims.totalLength || 10) + 'm</text>',
                    
                    // Gesamtbreite - Maßlinie
                    '<line x1="' + (500-totalLength/2-offset) + '" y1="' + (500-totalWidth/2) + '" x2="' + (500-totalLength/2-offset) + '" y2="' + (500+totalWidth/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtbreite - Text (gedreht)
                    '<text x="' + (500-totalLength/2-offset-25) + '" y="500" text-anchor="middle" font-size="18" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500-totalLength/2-offset-25) + ' 500)">' + (dims.totalWidth || 8) + 'm</text>',
                    
                    // Ausschnitt Länge - Maßlinie (innen)
                    '<line x1="' + (500-totalLength/2+cutoutLength) + '" y1="' + (500-totalWidth/2+cutoutWidth-40) + '" x2="' + (500+totalLength/2) + '" y2="' + (500-totalWidth/2+cutoutWidth-40) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Länge - Text
                    '<text x="' + (500+totalLength/4-cutoutLength/4) + '" y="' + (500-totalWidth/2+cutoutWidth-50) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.cutoutLength || 4) + 'm</text>',
                    
                    // Ausschnitt Breite - Maßlinie (seitlich)
                    '<line x1="' + (500+totalLength/2+40) + '" y1="' + (500-totalWidth/2) + '" x2="' + (500+totalLength/2+40) + '" y2="' + (500-totalWidth/2+cutoutWidth) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Breite - Text (gedreht)
                    '<text x="' + (500+totalLength/2+65) + '" y="' + (500-totalWidth/2+cutoutWidth/2) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (500+totalLength/2+65) + ' ' + (500-totalWidth/2+cutoutWidth/2) + ')">' + (dims.cutoutWidth || 4) + 'm</text>'
                ].join('');
                
            default:
                return '';
        }
    }    // KORRIGIERTE Bemaßung-SVG generieren mit vergrößerten Koordinaten (800x800)
    function getDimensionsSVG() {
        var dims = currentDimensions;
        var scale = 80; // VERGRÖSSERT von 60 auf 80 (passend zur Form)
        var offset = 120; // VERGRÖSSERT von 100 auf 120 für noch mehr Abstand
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                
                return [
                    // Untere Basis - Maßlinie
                    '<line x1="' + (400-bottomBase/2) + '" y1="' + (400+height/2+offset) + '" x2="' + (400+bottomBase/2) + '" y2="' + (400+height/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Untere Basis - Text
                    '<text x="400" y="' + (400+height/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.bottomBase || 8) + 'm</text>',
                    // Untere Basis - Verbindungslinien
                    '<line x1="' + (400-bottomBase/2) + '" y1="' + (400+height/2) + '" x2="' + (400-bottomBase/2) + '" y2="' + (400+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400+bottomBase/2) + '" y1="' + (400+height/2) + '" x2="' + (400+bottomBase/2) + '" y2="' + (400+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Obere Basis - Maßlinie
                    '<line x1="' + (400-topBase/2) + '" y1="' + (400-height/2-offset) + '" x2="' + (400+topBase/2) + '" y2="' + (400-height/2-offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Obere Basis - Text
                    '<text x="400" y="' + (400-height/2-offset-10) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.topBase || 6) + 'm</text>',
                    // Obere Basis - Verbindungslinien
                    '<line x1="' + (400-topBase/2) + '" y1="' + (400-height/2) + '" x2="' + (400-topBase/2) + '" y2="' + (400-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400+topBase/2) + '" y1="' + (400-height/2) + '" x2="' + (400+topBase/2) + '" y2="' + (400-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Höhe - Maßlinie
                    '<line x1="' + (400-bottomBase/2-offset) + '" y1="' + (400-height/2) + '" x2="' + (400-bottomBase/2-offset) + '" y2="' + (400+height/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Höhe - Text (gedreht)
                    '<text x="' + (400-bottomBase/2-offset-20) + '" y="400" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (400-bottomBase/2-offset-20) + ' 400)">' + (dims.height || 4) + 'm</text>',
                    // Höhe - Verbindungslinien
                    '<line x1="' + (400-bottomBase/2) + '" y1="' + (400-height/2) + '" x2="' + (400-bottomBase/2-offset) + '" y2="' + (400-height/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400-bottomBase/2) + '" y1="' + (400+height/2) + '" x2="' + (400-bottomBase/2-offset) + '" y2="' + (400+height/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                
                return [
                    // Länge - Maßlinie
                    '<line x1="' + (400-length/2) + '" y1="' + (400+width/2+offset) + '" x2="' + (400+length/2) + '" y2="' + (400+width/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Länge - Text
                    '<text x="400" y="' + (400+width/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.length || 8) + 'm</text>',
                    // Länge - Verbindungslinien
                    '<line x1="' + (400-length/2) + '" y1="' + (400+width/2) + '" x2="' + (400-length/2) + '" y2="' + (400+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400+length/2) + '" y1="' + (400+width/2) + '" x2="' + (400+length/2) + '" y2="' + (400+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Breite - Maßlinie
                    '<line x1="' + (400-length/2-offset) + '" y1="' + (400-width/2) + '" x2="' + (400-length/2-offset) + '" y2="' + (400+width/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Breite - Text (gedreht)
                    '<text x="' + (400-length/2-offset-20) + '" y="400" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (400-length/2-offset-20) + ' 400)">' + (dims.width || 5) + 'm</text>',
                    // Breite - Verbindungslinien
                    '<line x1="' + (400-length/2) + '" y1="' + (400-width/2) + '" x2="' + (400-length/2-offset) + '" y2="' + (400-width/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400-length/2) + '" y1="' + (400+width/2) + '" x2="' + (400-length/2-offset) + '" y2="' + (400+width/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale;
                
                return [
                    // Radius - Linie von Zentrum nach außen
                    '<line x1="400" y1="400" x2="' + (400-offset-40) + '" y2="400" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="400" y1="' + (400-katheteB) + '" x2="' + (400-offset-40) + '" y2="' + (400-katheteB) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Rechter Winkel Symbol (vergrößert)
                    '<path d="M ' + (400+30) + ' 400 L ' + (400+30) + ' ' + (400-30) + ' L 400 ' + (400-30) + '" stroke="#007bff" stroke-width="4" fill="none"/>',
                    '<text x="' + (400+40) + '" y="' + (400-40) + '" font-size="16" fill="#007bff">90°</text>'
                ].join('');
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                return [
                    // Gesamtlänge - Maßlinie
                    '<line x1="' + (400-totalLength/2) + '" y1="' + (400+totalWidth/2+offset) + '" x2="' + (400+totalLength/2) + '" y2="' + (400+totalWidth/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtlänge - Text
                    '<text x="400" y="' + (400+totalWidth/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.totalLength || 10) + 'm</text>',
                    
                    // Gesamtbreite - Maßlinie
                    '<line x1="' + (400-totalLength/2-offset) + '" y1="' + (400-totalWidth/2) + '" x2="' + (400-totalLength/2-offset) + '" y2="' + (400+totalWidth/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtbreite - Text (gedreht)
                    '<text x="' + (400-totalLength/2-offset-20) + '" y="400" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (400-totalLength/2-offset-20) + ' 400)">' + (dims.totalWidth || 8) + 'm</text>',
                    
                    // Ausschnitt Länge - Maßlinie (innen)
                    '<line x1="' + (400-totalLength/2+cutoutLength) + '" y1="' + (400-totalWidth/2+cutoutWidth-30) + '" x2="' + (400+totalLength/2) + '" y2="' + (400-totalWidth/2+cutoutWidth-30) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Länge - Text
                    '<text x="' + (400+totalLength/4-cutoutLength/4) + '" y="' + (400-totalWidth/2+cutoutWidth-35) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ff6b6b">' + (dims.cutoutLength || 4) + 'm</text>',
                    
                    // Ausschnitt Breite - Maßlinie (seitlich)
                    '<line x1="' + (400+totalLength/2+30) + '" y1="' + (400-totalWidth/2) + '" x2="' + (400+totalLength/2+30) + '" y2="' + (400-totalWidth/2+cutoutWidth) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Breite - Text (gedreht)
                    '<text x="' + (400+totalLength/2+50) + '" y="' + (400-totalWidth/2+cutoutWidth/2) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (400+totalLength/2+50) + ' ' + (400-totalWidth/2+cutoutWidth/2) + ')">' + (dims.cutoutWidth || 4) + 'm</text>'
                ].join('');
                
            default:
                return '';
        }
    }+radius) + '" y2="400" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrowhead)"/>',
                    // Radius - Text
                    '<text x="' + (400+radius/2) + '" y="390" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">r = ' + (dims.radius || 4) + 'm</text>',
                    
                    // Durchmesser - Maßlinie unten
                    '<line x1="' + (400-radius) + '" y1="' + (400+radius+offset) + '" x2="' + (400+radius) + '" y2="' + (400+radius+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Durchmesser - Text
                    '<text x="400" y="' + (400+radius+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">⌀ ' + ((dims.radius || 4) * 2) + 'm</text>',
                    // Durchmesser - Verbindungslinien
                    '<line x1="' + (400-radius) + '" y1="' + (400+radius) + '" x2="' + (400-radius) + '" y2="' + (400+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400+radius) + '" y1="' + (400+radius) + '" x2="' + (400+radius) + '" y2="' + (400+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Zentrum markieren
                    '<circle cx="400" cy="400" r="4" fill="#ff6b6b"/>',
                    '<text x="410" y="420" font-size="12" fill="#ff6b6b">Zentrum</text>'
                ].join('');
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                
                return [
                    // Kathete A - Maßlinie (horizontal)
                    '<line x1="400" y1="' + (400+offset+40) + '" x2="' + (400+katheteA) + '" y2="' + (400+offset+40) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete A - Text
                    '<text x="' + (400+katheteA/2) + '" y="' + (400+offset+60) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.katheteA || 4) + 'm</text>',
                    // Kathete A - Verbindungslinien
                    '<line x1="400" y1="400" x2="400" y2="' + (400+offset+40) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (400+katheteA) + '" y1="400" x2="' + (400+katheteA) + '" y2="' + (400+offset+40) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Kathete B - Maßlinie (vertikal)
                    '<line x1="' + (400-offset-40) + '" y1="400" x2="' + (400-offset-40) + '" y2="' + (400-katheteB) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete B - Text (gedreht)
                    '<text x="' + (400-offset-60) + '" y="' + (400-katheteB/2) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (400-offset-60) + ' ' + (400-katheteB/2) + ')">' + (dims.katheteB || 5) + 'm</text>',
                    // Kathete B - Verbindungslinien
                    '<line x1="400" y1="400" x2="' + (400// formauswahl.js - VERGRÖSSERTE VERSION mit korrekter Bemaßung

(function() {
    'use strict';
    
    // Globale Variablen
    var currentProjectData = {};
    var currentDimensions = {};
    var selectedVariant = null;

    // Debug-Funktionen
    function debugLog(message, data) {
        console.log('[FORMAUSWAHL] ' + message, data || '');
    }

    // Dimension-Konfiguration
    var dimensionConfig = {
        // Basis-Maße
        bottomBase: { label: 'Untere Basis', unit: 'm', default: 8, min: 1, max: 100 },
        topBase: { label: 'Obere Basis', unit: 'm', default: 6, min: 1, max: 100 },
        height: { label: 'Höhe', unit: 'm', default: 4, min: 1, max: 50 },
        length: { label: 'Länge', unit: 'm', default: 8, min: 1, max: 100 },
        width: { label: 'Breite', unit: 'm', default: 5, min: 1, max: 100 },
        side: { label: 'Seitenlänge', unit: 'm', default: 5, min: 1, max: 50 },
        radius: { label: 'Radius', unit: 'm', default: 4, min: 0.5, max: 50 },
        katheteA: { label: 'Kathete A', unit: 'm', default: 4, min: 1, max: 50 },
        katheteB: { label: 'Kathete B', unit: 'm', default: 5, min: 1, max: 50 },
        totalLength: { label: 'Gesamtlänge', unit: 'm', default: 10, min: 2, max: 100 },
        totalWidth: { label: 'Gesamtbreite', unit: 'm', default: 8, min: 2, max: 100 },
        cutoutLength: { label: 'Ausschnitt Länge', unit: 'm', default: 4, min: 1, max: 50 },
        cutoutWidth: { label: 'Ausschnitt Breite', unit: 'm', default: 4, min: 1, max: 50 },
        sideA: { label: 'Seite A', unit: 'm', default: 5, min: 1, max: 100 },
        sideB: { label: 'Seite B', unit: 'm', default: 6, min: 1, max: 100 },
        sideC: { label: 'Seite C', unit: 'm', default: 7, min: 1, max: 100 },
        angle: { label: 'Winkel', unit: '°', default: 60, min: 10, max: 170 },
        radiusX: { label: 'Radius X', unit: 'm', default: 5, min: 0.5, max: 50 },
        radiusY: { label: 'Radius Y', unit: 'm', default: 3, min: 0.5, max: 50 }
    };

    // Form-Informationen
    var shapeInfo = {
        trapez: { 
            name: 'Trapez', 
            description: 'Viereck mit zwei parallelen Seiten', 
            dimensions: ['bottomBase', 'topBase', 'height'] 
        },
        rechteck: { 
            name: 'Rechteck', 
            description: 'Klassische rechteckige Form', 
            dimensions: ['length', 'width'] 
        },
        quadrat: { 
            name: 'Quadrat', 
            description: 'Gleichseitiges Rechteck', 
            dimensions: ['side'] 
        },
        kreis: { 
            name: 'Kreis', 
            description: 'Perfekte Rundform', 
            dimensions: ['radius'] 
        },
        oval: { 
            name: 'Oval', 
            description: 'Längliche Rundform', 
            dimensions: ['radiusX', 'radiusY'] 
        },
        dreieck: { 
            name: 'Gleichseitiges Dreieck', 
            description: 'Dreieck mit allen Seiten gleich', 
            dimensions: ['side'] 
        },
        rechtwinklig: { 
            name: 'Rechtwinkliges Dreieck', 
            description: 'Dreieck mit rechtem Winkel', 
            dimensions: ['katheteA', 'katheteB'] 
        },
        ungleichschenklig: { 
            name: 'Ungleichschenkliges Dreieck', 
            description: 'Dreieck mit drei verschiedenen Seiten', 
            dimensions: ['sideA', 'sideB', 'sideC'] 
        },
        parallelogramm: { 
            name: 'Parallelogramm', 
            description: 'Schiefes Rechteck', 
            dimensions: ['length', 'width', 'angle'] 
        },
        rhombus: { 
            name: 'Rhombus', 
            description: 'Rautenform', 
            dimensions: ['side', 'angle'] 
        },
        lform: { 
            name: 'L-Form', 
            description: 'L-förmige Grundform', 
            dimensions: ['totalLength', 'totalWidth', 'cutoutLength', 'cutoutWidth'] 
        }
    };

    // Storage-Funktionen
    function saveData() {
        try {
            currentProjectData.geometry = {
                variant: selectedVariant,
                shapeType: selectedVariant,
                dimensions: currentDimensions,
                area: calculateArea(),
                perimeter: calculatePerimeter(),
                timestamp: Date.now()
            };
            
            localStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
            debugLog('Daten gespeichert', currentProjectData);
            return true;
        } catch (e) {
            try {
                sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(currentProjectData));
                debugLog('Daten in sessionStorage gespeichert');
                return true;
            } catch (e2) {
                debugLog('Fehler beim Speichern', e2);
                return false;
            }
        }
    }

    function loadData() {
        try {
            var saved = localStorage.getItem('dachplattenrechner_data');
            if (!saved) {
                saved = sessionStorage.getItem('dachplattenrechner_data');
            }
            var data = saved ? JSON.parse(saved) : {};
            debugLog('Daten geladen', data);
            return data;
        } catch (e) {
            debugLog('Fehler beim Laden', e);
            return {};
        }
    }

    // Form-Info anzeigen
    function displayShapeInfo() {
        debugLog('=== LADE FORM-INFO ===');
        
        var roofShape = currentProjectData.roofShape;
        if (!roofShape) {
            debugLog('Keine roofShape gefunden, verwende Demo-Daten');
            selectedVariant = 'trapez'; // Fallback
            return true;
        }
        
        selectedVariant = roofShape.variant || roofShape.baseShape || 'trapez';
        debugLog('Gewählte Variante: ' + selectedVariant);
        
        var info = shapeInfo[selectedVariant];
        if (info) {
            var titleElement = document.getElementById('shape-title');
            var descElement = document.getElementById('shape-description');
            
            if (titleElement) titleElement.textContent = info.name;
            if (descElement) descElement.textContent = info.description;
            
            debugLog('Form-Info angezeigt: ' + info.name);
        } else {
            debugLog('Form-Info nicht gefunden für: ' + selectedVariant);
        }
        
        return true;
    }

    // Dimension-Inputs erstellen
    function createDimensionInputs() {
        debugLog('=== ERSTELLE DIMENSION-INPUTS ===');
        
        var dimensionsGrid = document.getElementById('dimensions-grid');
        if (!dimensionsGrid) {
            debugLog('dimensions-grid nicht gefunden!');
            return;
        }
        
        dimensionsGrid.innerHTML = '';
        
        var info = shapeInfo[selectedVariant];
        if (!info) {
            debugLog('Form-Info nicht gefunden für: ' + selectedVariant);
            return;
        }
        
        var dimensions = info.dimensions;
        debugLog('Erstelle Inputs für Dimensionen: ' + dimensions.join(', '));
        
        for (var i = 0; i < dimensions.length; i++) {
            var dim = dimensions[i];
            var config = dimensionConfig[dim];
            
            if (!config) {
                debugLog('Dimension-Config nicht gefunden für: ' + dim);
                continue;
            }
            
            var savedValue = currentDimensions[dim] || config.default;
            currentDimensions[dim] = savedValue;
            
            var inputContainer = document.createElement('div');
            inputContainer.className = 'dimension-input';
            
            inputContainer.innerHTML = 
                '<label class="dimension-label">' + config.label + '</label>' +
                '<div style="display: flex; align-items: center;">' +
                    '<input type="number" ' +
                           'class="dimension-value" ' +
                           'data-dimension="' + dim + '"' +
                           'value="' + savedValue + '"' +
                           'min="' + config.min + '"' +
                           'max="' + config.max + '"' +
                           'step="0.1">' +
                    '<span class="dimension-unit">' + config.unit + '</span>' +
                '</div>';
            
            dimensionsGrid.appendChild(inputContainer);
            
            // Event listener für Änderungen
            var input = inputContainer.querySelector('.dimension-value');
            input.addEventListener('input', function(e) {
                var dimension = e.target.getAttribute('data-dimension');
                var value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    currentDimensions[dimension] = value;
                    updatePreview();
                    updateCalculation();
                }
            });
        }
        
        debugLog('Dimension-Inputs erstellt: ' + dimensions.length + ' Inputs');
    }

    // Form-Vorschau aktualisieren
    function updatePreview() {
        var shapeGroup = document.getElementById('shape-group');
        var dimensionsGroup = document.getElementById('dimensions-group');
        
        if (!shapeGroup) return;
        
        // Shape neu zeichnen
        shapeGroup.innerHTML = getShapeSVG();
        
        // Bemaßung hinzufügen
        if (dimensionsGroup) {
            dimensionsGroup.innerHTML = createArrowMarker() + getDimensionsSVG();
        }
    }

    // SVG für Form generieren
    function getShapeSVG() {
        var dims = currentDimensions;
        var scale = 100; // NOCH GRÖSSER von 80 auf 100 für maximale Sichtbarkeit
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                var points = (-bottomBase/2) + ',' + (height/2) + ' ' + 
                           (bottomBase/2) + ',' + (height/2) + ' ' + 
                           (topBase/2) + ',' + (-height/2) + ' ' + 
                           (-topBase/2) + ',' + (-height/2);
                return '<polygon points="' + points + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                return '<rect x="' + (-length/2) + '" y="' + (-width/2) + '" width="' + length + '" height="' + width + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'quadrat':
                var side = (dims.side || 5) * scale;
                return '<rect x="' + (-side/2) + '" y="' + (-side/2) + '" width="' + side + '" height="' + side + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale;
                return '<circle cx="0" cy="0" r="' + radius + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'oval':
                var rx = (dims.radiusX || 5) * scale;
                var ry = (dims.radiusY || 3) * scale;
                return '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + ry + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'dreieck':
                var sideEq = (dims.side || 5) * scale;
                var heightEq = sideEq * Math.sqrt(3) / 2;
                var pointsEq = '0,' + (-heightEq*2/3) + ' ' + (-sideEq/2) + ',' + (heightEq/3) + ' ' + (sideEq/2) + ',' + (heightEq/3);
                return '<polygon points="' + pointsEq + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                // Dreieck mit rechtem Winkel unten links, Kathete A nach rechts, Kathete B nach oben
                var pointsRight = '0,0 ' + katheteA + ',0 0,' + (-katheteB);
                return '<polygon points="' + pointsRight + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                var lPoints = [
                    (-totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2),
                    (totalLength/2) + ',' + (-totalWidth/2 + cutoutWidth),
                    (-totalLength/2 + cutoutLength) + ',' + (-totalWidth/2 + cutoutWidth),
                    (-totalLength/2 + cutoutLength) + ',' + (totalWidth/2),
                    (-totalLength/2) + ',' + (totalWidth/2)
                ];
                return '<polygon points="' + lPoints.join(' ') + '" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
                
            default:
                return '<rect x="-100" y="-75" width="200" height="150" fill="url(#shapeGradient)" stroke="#007bff" stroke-width="5" filter="url(#shadowEffect)"/>';
        }
    }

    // Arrow-Marker für SVG
    function createArrowMarker() {
        return '<defs>' +
               '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">' +
               '<polygon points="0 0, 10 3.5, 0 7" fill="#ff6b6b" />' +
               '</marker>' +
               '</defs>';
    }

    // KORRIGIERTE Bemaßung-SVG generieren mit vergrößerten Koordinaten (600x600)
    function getDimensionsSVG() {
        var dims = currentDimensions;
        var scale = 60; // VERGRÖSSERT von 30 auf 60 (passend zur Form)
        var offset = 100; // VERGRÖSSERT von 60 auf 100 für noch mehr Abstand
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = (dims.bottomBase || 8) * scale;
                var topBase = (dims.topBase || 6) * scale;
                var height = (dims.height || 4) * scale;
                
                return [
                    // Untere Basis - Maßlinie
                    '<line x1="' + (300-bottomBase/2) + '" y1="' + (300+height/2+offset) + '" x2="' + (300+bottomBase/2) + '" y2="' + (300+height/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Untere Basis - Text
                    '<text x="300" y="' + (300+height/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.bottomBase || 8) + 'm</text>',
                    // Untere Basis - Verbindungslinien
                    '<line x1="' + (300-bottomBase/2) + '" y1="' + (300+height/2) + '" x2="' + (300-bottomBase/2) + '" y2="' + (300+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300+bottomBase/2) + '" y1="' + (300+height/2) + '" x2="' + (300+bottomBase/2) + '" y2="' + (300+height/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Obere Basis - Maßlinie
                    '<line x1="' + (300-topBase/2) + '" y1="' + (300-height/2-offset) + '" x2="' + (300+topBase/2) + '" y2="' + (300-height/2-offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Obere Basis - Text
                    '<text x="300" y="' + (300-height/2-offset-10) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.topBase || 6) + 'm</text>',
                    // Obere Basis - Verbindungslinien
                    '<line x1="' + (300-topBase/2) + '" y1="' + (300-height/2) + '" x2="' + (300-topBase/2) + '" y2="' + (300-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300+topBase/2) + '" y1="' + (300-height/2) + '" x2="' + (300+topBase/2) + '" y2="' + (300-height/2-offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Höhe - Maßlinie
                    '<line x1="' + (300-bottomBase/2-offset) + '" y1="' + (300-height/2) + '" x2="' + (300-bottomBase/2-offset) + '" y2="' + (300+height/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Höhe - Text (gedreht)
                    '<text x="' + (300-bottomBase/2-offset-20) + '" y="300" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (300-bottomBase/2-offset-20) + ' 300)">' + (dims.height || 4) + 'm</text>',
                    // Höhe - Verbindungslinien
                    '<line x1="' + (300-bottomBase/2) + '" y1="' + (300-height/2) + '" x2="' + (300-bottomBase/2-offset) + '" y2="' + (300-height/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300-bottomBase/2) + '" y1="' + (300+height/2) + '" x2="' + (300-bottomBase/2-offset) + '" y2="' + (300+height/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'rechteck':
                var length = (dims.length || 8) * scale;
                var width = (dims.width || 5) * scale;
                
                return [
                    // Länge - Maßlinie
                    '<line x1="' + (300-length/2) + '" y1="' + (300+width/2+offset) + '" x2="' + (300+length/2) + '" y2="' + (300+width/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Länge - Text
                    '<text x="300" y="' + (300+width/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.length || 8) + 'm</text>',
                    // Länge - Verbindungslinien
                    '<line x1="' + (300-length/2) + '" y1="' + (300+width/2) + '" x2="' + (300-length/2) + '" y2="' + (300+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300+length/2) + '" y1="' + (300+width/2) + '" x2="' + (300+length/2) + '" y2="' + (300+width/2+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Breite - Maßlinie
                    '<line x1="' + (300-length/2-offset) + '" y1="' + (300-width/2) + '" x2="' + (300-length/2-offset) + '" y2="' + (300+width/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Breite - Text (gedreht)
                    '<text x="' + (300-length/2-offset-20) + '" y="300" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (300-length/2-offset-20) + ' 300)">' + (dims.width || 5) + 'm</text>',
                    // Breite - Verbindungslinien
                    '<line x1="' + (300-length/2) + '" y1="' + (300-width/2) + '" x2="' + (300-length/2-offset) + '" y2="' + (300-width/2) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300-length/2) + '" y1="' + (300+width/2) + '" x2="' + (300-length/2-offset) + '" y2="' + (300+width/2) + '" stroke="#ff6b6b" stroke-width="2"/>'
                ].join('');
                
            case 'kreis':
                var radius = (dims.radius || 4) * scale;
                
                return [
                    // Radius - Linie von Zentrum nach außen
                    '<line x1="300" y1="300" x2="' + (300+radius) + '" y2="300" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-end="url(#arrowhead)"/>',
                    // Radius - Text
                    '<text x="' + (300+radius/2) + '" y="290" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">r = ' + (dims.radius || 4) + 'm</text>',
                    
                    // Durchmesser - Maßlinie unten
                    '<line x1="' + (300-radius) + '" y1="' + (300+radius+offset) + '" x2="' + (300+radius) + '" y2="' + (300+radius+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Durchmesser - Text
                    '<text x="300" y="' + (300+radius+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">⌀ ' + ((dims.radius || 4) * 2) + 'm</text>',
                    // Durchmesser - Verbindungslinien
                    '<line x1="' + (300-radius) + '" y1="' + (300+radius) + '" x2="' + (300-radius) + '" y2="' + (300+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300+radius) + '" y1="' + (300+radius) + '" x2="' + (300+radius) + '" y2="' + (300+radius+offset) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Zentrum markieren
                    '<circle cx="300" cy="300" r="4" fill="#ff6b6b"/>',
                    '<text x="310" y="320" font-size="12" fill="#ff6b6b">Zentrum</text>'
                ].join('');
                
            case 'rechtwinklig':
                var katheteA = (dims.katheteA || 4) * scale;
                var katheteB = (dims.katheteB || 5) * scale;
                
                return [
                    // Kathete A - Maßlinie (horizontal)
                    '<line x1="300" y1="' + (300+offset+40) + '" x2="' + (300+katheteA) + '" y2="' + (300+offset+40) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete A - Text
                    '<text x="' + (300+katheteA/2) + '" y="' + (300+offset+60) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.katheteA || 4) + 'm</text>',
                    // Kathete A - Verbindungslinien
                    '<line x1="300" y1="300" x2="300" y2="' + (300+offset+40) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="' + (300+katheteA) + '" y1="300" x2="' + (300+katheteA) + '" y2="' + (300+offset+40) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Kathete B - Maßlinie (vertikal)
                    '<line x1="' + (300-offset-40) + '" y1="300" x2="' + (300-offset-40) + '" y2="' + (300-katheteB) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Kathete B - Text (gedreht)
                    '<text x="' + (300-offset-60) + '" y="' + (300-katheteB/2) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (300-offset-60) + ' ' + (300-katheteB/2) + ')">' + (dims.katheteB || 5) + 'm</text>',
                    // Kathete B - Verbindungslinien
                    '<line x1="300" y1="300" x2="' + (300-offset-40) + '" y2="300" stroke="#ff6b6b" stroke-width="2"/>',
                    '<line x1="300" y1="' + (300-katheteB) + '" x2="' + (300-offset-40) + '" y2="' + (300-katheteB) + '" stroke="#ff6b6b" stroke-width="2"/>',
                    
                    // Rechter Winkel Symbol (vergrößert)
                    '<path d="M ' + (300+30) + ' 300 L ' + (300+30) + ' ' + (300-30) + ' L 300 ' + (300-30) + '" stroke="#007bff" stroke-width="4" fill="none"/>',
                    '<text x="' + (300+40) + '" y="' + (300-40) + '" font-size="16" fill="#007bff">90°</text>'
                ].join('');
                
            case 'lform':
                var totalLength = (dims.totalLength || 10) * scale;
                var totalWidth = (dims.totalWidth || 8) * scale;
                var cutoutLength = (dims.cutoutLength || 4) * scale;
                var cutoutWidth = (dims.cutoutWidth || 4) * scale;
                
                return [
                    // Gesamtlänge - Maßlinie
                    '<line x1="' + (300-totalLength/2) + '" y1="' + (300+totalWidth/2+offset) + '" x2="' + (300+totalLength/2) + '" y2="' + (300+totalWidth/2+offset) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtlänge - Text
                    '<text x="300" y="' + (300+totalWidth/2+offset+20) + '" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b">' + (dims.totalLength || 10) + 'm</text>',
                    
                    // Gesamtbreite - Maßlinie
                    '<line x1="' + (300-totalLength/2-offset) + '" y1="' + (300-totalWidth/2) + '" x2="' + (300-totalLength/2-offset) + '" y2="' + (300+totalWidth/2) + '" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="5,5" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Gesamtbreite - Text (gedreht)
                    '<text x="' + (300-totalLength/2-offset-20) + '" y="300" text-anchor="middle" font-size="16" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (300-totalLength/2-offset-20) + ' 300)">' + (dims.totalWidth || 8) + 'm</text>',
                    
                    // Ausschnitt Länge - Maßlinie (innen)
                    '<line x1="' + (300-totalLength/2+cutoutLength) + '" y1="' + (300-totalWidth/2+cutoutWidth-30) + '" x2="' + (300+totalLength/2) + '" y2="' + (300-totalWidth/2+cutoutWidth-30) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Länge - Text
                    '<text x="' + (300+totalLength/4-cutoutLength/4) + '" y="' + (300-totalWidth/2+cutoutWidth-35) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ff6b6b">' + (dims.cutoutLength || 4) + 'm</text>',
                    
                    // Ausschnitt Breite - Maßlinie (seitlich)
                    '<line x1="' + (300+totalLength/2+30) + '" y1="' + (300-totalWidth/2) + '" x2="' + (300+totalLength/2+30) + '" y2="' + (300-totalWidth/2+cutoutWidth) + '" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="3,3" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>',
                    // Ausschnitt Breite - Text (gedreht)
                    '<text x="' + (300+totalLength/2+50) + '" y="' + (300-totalWidth/2+cutoutWidth/2) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ff6b6b" transform="rotate(-90 ' + (300+totalLength/2+50) + ' ' + (300-totalWidth/2+cutoutWidth/2) + ')">' + (dims.cutoutWidth || 4) + 'm</text>'
                ].join('');
                
            default:
                return '';
        }
    }

    // Berechnungen
    function calculateArea() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                return ((bottomBase + topBase) / 2) * height;
                
            case 'rechteck':
                return (dims.length || 8) * (dims.width || 5);
                
            case 'quadrat':
                return Math.pow(dims.side || 5, 2);
                
            case 'kreis':
                return Math.PI * Math.pow(dims.radius || 4, 2);
                
            case 'oval':
                return Math.PI * (dims.radiusX || 5) * (dims.radiusY || 3);
                
            case 'dreieck':
                var sideEq = dims.side || 5;
                return (Math.sqrt(3) / 4) * Math.pow(sideEq, 2);
                
            case 'rechtwinklig':
                return ((dims.katheteA || 4) * (dims.katheteB || 5)) / 2;
                
            case 'lform':
                var totalLength = dims.totalLength || 10;
                var totalWidth = dims.totalWidth || 8;
                var cutoutLength = dims.cutoutLength || 4;
                var cutoutWidth = dims.cutoutWidth || 4;
                return (totalLength * totalWidth) - (cutoutLength * cutoutWidth);
                
            default:
                return 40;
        }
    }

    function calculatePerimeter() {
        var dims = currentDimensions;
        
        switch (selectedVariant) {
            case 'trapez':
                var bottomBase = dims.bottomBase || 8;
                var topBase = dims.topBase || 6;
                var height = dims.height || 4;
                var sideDiff = Math.abs(bottomBase - topBase) / 2;
                var sideLength = Math.sqrt(Math.pow(height, 2) + Math.pow(sideDiff, 2));
                return bottomBase + topBase + 2 * sideLength;
                
            case 'rechteck':
                return 2 * ((dims.length || 8) + (dims.width || 5));
                
            case 'quadrat':
                return 4 * (dims.side || 5);
                
            case 'kreis':
                return 2 * Math.PI * (dims.radius || 4);
                
            case 'rechtwinklig':
                var katheteA = dims.katheteA || 4;
                var katheteB = dims.katheteB || 5;
                var hypotenuse = Math.sqrt(Math.pow(katheteA, 2) + Math.pow(katheteB, 2));
                return katheteA + katheteB + hypotenuse;
                
            default:
                return 24;
        }
    }

    function updateCalculation() {
        var area = calculateArea();
        var perimeter = calculatePerimeter();
        
        var areaElement = document.getElementById('calc-area');
        var perimeterElement = document.getElementById('calc-perimeter');
        
        if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
        if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
        
        var continueBtn = document.getElementById('btn-continue');
        if (continueBtn) {
            continueBtn.disabled = area <= 0;
        }
    }

    // Navigation
    function saveAndContinue() {
        if (!selectedVariant) {
            alert('Keine Form gefunden!');
            return;
        }
        
        var saved = saveData();
        if (!saved) {
            alert('Fehler beim Speichern!');
            return;
        }
        
        debugLog('Weiterleitung zur Berechnung');
        window.location.href = 'berechnung.html';
    }

    function goBack() {
        window.location.href = 'Editor.html';
    }

    // Test-Funktionen
    window.testShape = function(variant) {
        selectedVariant = variant;
        
        // Neue Standarddimensionen setzen
        var info = shapeInfo[selectedVariant];
        if (info) {
            currentDimensions = {};
            for (var i = 0; i < info.dimensions.length; i++) {
                var dim = info.dimensions[i];
                var config = dimensionConfig[dim];
                if (config) {
                    currentDimensions[dim] = config.default;
                }
            }
        }
        
        displayShapeInfo();
        createDimensionInputs();
        updatePreview();
        updateCalculation();
        
        console.log('Form gewechselt zu: ' + variant);
    };

    // Globale Funktionen
    window.saveAndContinue = saveAndContinue;
    window.goBack = goBack;
    window.availableShapes = Object.keys(shapeInfo);

    // Initialisierung
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('=== SEITE GELADEN ===');
        
        currentProjectData = loadData();
        
        // Fallback für Demo
        if (!currentProjectData.profile) {
            currentProjectData = {
                profile: {
                    kategorie: 'trapezprofil',
                    profilKey: 'TP20',
                    deckbreite: 1000,
                    profilname: 'TP20'
                },
                roofShape: {
                    variant: 'rechtwinklig'  // RECHTWINKLIGES DREIECK als Standard
                }
            };
        }
        
        var shapeLoaded = displayShapeInfo();
        if (shapeLoaded) {
            createDimensionInputs();
            updatePreview();
            updateCalculation();
        }
        
        // Event Listeners
        var backBtn = document.getElementById('btn-back');
        var continueBtn = document.getElementById('btn-continue');
        
        if (backBtn) backBtn.addEventListener('click', goBack);
        if (continueBtn) continueBtn.addEventListener('click', saveAndContinue);
        
        debugLog('Initialisierung abgeschlossen');
    });

    debugLog('formauswahl.js geladen - Mit vergrößertem Vorschaufenster');

})();
