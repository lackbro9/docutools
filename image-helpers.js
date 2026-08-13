/* DocuTools - shared image helper functions built on Canvas/File APIs */
(function(){
  'use strict';

  function loadImageElement(file){
    return new Promise(function(resolve, reject){
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){ resolve({ img: img, url: url, width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('Could not read this image file.')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality){
    return new Promise(function(resolve, reject){
      canvas.toBlob(function(blob){
        if (blob) resolve(blob); else reject(new Error('Could not encode the image.'));
      }, type, quality);
    });
  }

  function drawToCanvas(img, width, height, fillWhite){
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    if (fillWhite){
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  }

  function supportsWebpEncoding(){
    var canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    var dataUrl = canvas.toDataURL('image/webp');
    return dataUrl.indexOf('data:image/webp') === 0;
  }

  window.DocuImage = {
    loadImageElement: loadImageElement,
    canvasToBlob: canvasToBlob,
    drawToCanvas: drawToCanvas,
    supportsWebpEncoding: supportsWebpEncoding
  };
})();
