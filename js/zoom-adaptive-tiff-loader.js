// zoom-adaptive-tiff-loader.js

/**
 * Add hover tooltip functionality to display raster values
 */
function addHoverTooltip(map, rasterArray, bounds, width, height, layerName, tiffLayers) {
    const tooltip = L.tooltip({ permanent: false, direction: 'top', offset: [0, -10] });
    
    function onMouseMove(e) {
        if (!bounds.contains(e.latlng)) {
            map.closeTooltip(tooltip);
            return;
        }
        
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        const latMax = bounds.getNorth();
        const latMin = bounds.getSouth();
        const lngMin = bounds.getWest();
        const lngMax = bounds.getEast();

        const xPct = (lng - lngMin) / (lngMax - lngMin);
        const yPct = (latMax - lat) / (latMax - latMin);

        const x = Math.floor(xPct * width);
        const y = Math.floor(yPct * height);

        const index = y * width + x;

        if (x >= 0 && x < width && y >= 0 && y < height) {
            const value = rasterArray[index];
            // FIX: Ensure -9999 doesn't show in tooltip
            if (value !== undefined && !isNaN(value) && value !== -1 && value !== 0 && value !== -9999) {
                tooltip.setLatLng(e.latlng).setContent(`Value: ${value.toFixed(2)}`);
                tooltip.addTo(map);
            } else {
                map.closeTooltip(tooltip);
            }
        } else {
            map.closeTooltip(tooltip);
        }
    }

    function onMouseOut() {
        map.closeTooltip(tooltip);
    }

    function attachEvents() {
        map.on('mousemove', onMouseMove);
        map.on('mouseout', onMouseOut);
    }

    function detachEvents() {
        map.off('mousemove', onMouseMove);
        map.off('mouseout', onMouseOut);
        map.closeTooltip(tooltip);
    }

    if (tiffLayers[layerName] && tiffLayers[layerName].on) {
        tiffLayers[layerName].on('add', attachEvents);
        tiffLayers[layerName].on('remove', detachEvents);
    }

    if (map.hasLayer(tiffLayers[layerName])) {
        attachEvents();
    }
}

/**
 * Simplified TIFF Loader - Static Image Version
 * Removed Zoom-Adaptive features to ensure stable de-selection.
 */

/**
 * Simplified TIFF Loader - Static Image Version
 * Removed Zoom-Adaptive features and duplicate functions to fix SyntaxErrors.
 */

export async function loadTiff(url, layerName, tiffLayers, map, colorScale) {
    console.log(`Loading Static TIFF: ${layerName}`);

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    
    const width = image.getWidth();
    const height = image.getHeight();
    const tiePoint = image.getTiePoints()[0];
    const pixelScale = image.getFileDirectory().ModelPixelScale;
    
    const minX = tiePoint.x;
    const maxY = tiePoint.y;
    const maxX = minX + pixelScale[0] * width;
    const minY = maxY - pixelScale[1] * height;

    const bounds = L.latLngBounds([[minY, minX], [maxY, maxX]]);
    const rasterData = await image.readRasters();
    const rasterArray = rasterData[0]; 

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];
        const dataIndex = i * 4;
        
        // Treat -9999, -1, and 0 as fully transparent (NA values)
        if (value === -1 || value === 0 || value === -9999 || isNaN(value)) {
            imgData.data[dataIndex + 3] = 0; 
            continue;
        }

        const color = getColorForValue(value, colorScale);
        imgData.data[dataIndex + 0] = color[0];
        imgData.data[dataIndex + 1] = color[1];
        imgData.data[dataIndex + 2] = color[2];
        imgData.data[dataIndex + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    
    const layer = L.imageOverlay(canvas.toDataURL(), bounds, { 
        opacity: 1,
        interactive: true
    });
    
    // Store reference for removal
    tiffLayers[layerName] = layer;
    layer.addTo(map);

    return layer;
}

/**
 * Helper: Get RGB color based on value and scale
 */
function getColorForValue(value, colorScale) {
    const { ranges, colors } = colorScale;
    for (let i = 0; i < ranges.length - 1; i++) {
        if (value >= ranges[i] && value < ranges[i + 1]) {
            return hexToRgb(colors[i]);
        }
    }
    return hexToRgb(colors[colors.length - 1]);
}

/**
 * Helper: Convert Hex to RGB Array
 */
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

/**
 * Create an image overlay with Vertical Reprojection (Lat/Lon -> Mercator)
 */
function createImageOverlay(rasterArray, bounds, colorScale, layerName, tiffLayers, map, meta) {
    const width = meta.width;
    const height = meta.height;
    const currentZoom = map.getZoom();
    const shouldSmooth = currentZoom < 8;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = shouldSmooth;
    const imgData = ctx.createImageData(width, height);
    
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const pMax = L.Projection.SphericalMercator.project(northEast); 
    const pMin = L.Projection.SphericalMercator.project(southWest); 
    
    const maxMercY = Math.max(pMax.y, pMin.y);
    const minMercY = Math.min(pMax.y, pMin.y);
    const mercHeight = maxMercY - minMercY;
    const colorLookup = new Map();
    
    for (let targetY = 0; targetY < height; targetY++) {
        const pct = targetY / height;
        const currentMercY = maxMercY - (pct * mercHeight);
        const latLng = L.Projection.SphericalMercator.unproject(L.point(0, currentMercY));
        const currentLat = latLng.lat;
        
        let sourceY = Math.floor((meta.maxLat - currentLat) / meta.scaleY);
        if (sourceY < 0) sourceY = 0;
        if (sourceY >= height) sourceY = height - 1;
        
        const targetRowOffset = targetY * width * 4;
        const sourceRowOffset = sourceY * width;
        
        for (let x = 0; x < width; x++) {
            const value = rasterArray[sourceRowOffset + x];
            const dataIndex = targetRowOffset + (x * 4);
            
            // FIX: Added -9999 to the exclusion list for full transparency
            if (value === -1 || value === 0 || value === -9999 || isNaN(value)) {
                imgData.data[dataIndex + 3] = 0; 
                continue;
            }

            let color;
            if (colorLookup.has(value)) {
                color = colorLookup.get(value);
            } else {
                color = getColorForValue(value, colorScale);
                colorLookup.set(value, color);
            }
            
            imgData.data[dataIndex + 0] = color[0];
            imgData.data[dataIndex + 1] = color[1];
            imgData.data[dataIndex + 2] = color[2];
            imgData.data[dataIndex + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    const imgUrl = canvas.toDataURL();
    
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { 
        opacity: 1,
        crossOrigin: true,
        interactive: true,
        className: shouldSmooth ? 'smooth-image' : 'crisp-image'
    });
    
    tiffLayers[layerName].addTo(map);
    
    tiffLayers[layerName].on('load', function() {
        const imgElement = this._image;
        if (imgElement) {
            imgElement.style.imageRendering = shouldSmooth ? 'auto' : 'pixelated';
        }
    });
}
