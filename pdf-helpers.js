/* DocuTools - shared PDF/image helper functions built on pdf-lib */
(function(){
  'use strict';

  function readAsArrayBuffer(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = function(){ reject(new Error('Could not read file: ' + file.name)); };
      reader.readAsArrayBuffer(file);
    });
  }

  function readAsDataURL(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = function(){ reject(new Error('Could not read file: ' + file.name)); };
      reader.readAsDataURL(file);
    });
  }

  /* Builds a PDF (as Uint8Array) from an ordered array of image files.
     Each page is sized to fit the image, inset within the given page margin. */
  function buildPdfFromImages(orderedFiles, onProgress){
    return window.DocuLibs.ensurePdfLib().then(function(PDFLib){
      var pdfDoc;
      return PDFLib.PDFDocument.create().then(function(doc){
        pdfDoc = doc;
        var chain = Promise.resolve();
        orderedFiles.forEach(function(file, index){
          chain = chain.then(function(){
            return readAsArrayBuffer(file).then(function(buffer){
              var isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name);
              var embedPromise = isPng ? pdfDoc.embedPng(buffer) : pdfDoc.embedJpg(buffer);
              return embedPromise.then(function(image){
                var maxWidth = 1600;
                var maxHeight = 2000;
                var scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
                var w = image.width * scale;
                var h = image.height * scale;
                var page = pdfDoc.addPage([w, h]);
                page.drawImage(image, { x: 0, y: 0, width: w, height: h });
                if (onProgress) onProgress(index + 1, orderedFiles.length);
              });
            });
          });
        });
        return chain;
      }).then(function(){
        return pdfDoc.save();
      });
    });
  }

  /* Merges multiple PDF files (array of File) into one PDF (Uint8Array) */
  function mergePdfFiles(orderedFiles, onProgress){
    return window.DocuLibs.ensurePdfLib().then(function(PDFLib){
      var mergedDoc;
      return PDFLib.PDFDocument.create().then(function(doc){
        mergedDoc = doc;
        var chain = Promise.resolve();
        orderedFiles.forEach(function(file, index){
          chain = chain.then(function(){
            return readAsArrayBuffer(file).then(function(buffer){
              return PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true }).then(function(srcDoc){
                return mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices()).then(function(pages){
                  pages.forEach(function(p){ mergedDoc.addPage(p); });
                  if (onProgress) onProgress(index + 1, orderedFiles.length);
                });
              });
            });
          });
        });
        return chain;
      }).then(function(){
        return mergedDoc.save();
      });
    });
  }

  /* Loads a PDF file and returns { doc, pageCount } using pdf-lib (for split/extract) */
  function loadPdfDoc(file){
    return window.DocuLibs.ensurePdfLib().then(function(PDFLib){
      return readAsArrayBuffer(file).then(function(buffer){
        return PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true }).then(function(doc){
          return { PDFLib: PDFLib, doc: doc, pageCount: doc.getPageCount() };
        });
      });
    });
  }

  /* Builds a new PDF containing only the given zero-based page indices, in the given order */
  function extractPages(PDFLib, srcDoc, pageIndices){
    return PDFLib.PDFDocument.create().then(function(newDoc){
      return newDoc.copyPages(srcDoc, pageIndices).then(function(pages){
        pages.forEach(function(p){ newDoc.addPage(p); });
        return newDoc.save();
      });
    });
  }

  /* Parses a page range string like "1-3,5,8-10" into a zero-based, de-duplicated index array.
     Returns { indices, error } */
  function parsePageRanges(rangeText, pageCount){
    var indices = [];
    var seen = {};
    var text = (rangeText || '').trim();
    if (!text) return { error: 'Please enter at least one page number or range.' };
    var parts = text.split(',');
    for (var i = 0; i < parts.length; i++){
      var part = parts[i].trim();
      if (!part) continue;
      var rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      var singleMatch = part.match(/^(\d+)$/);
      if (rangeMatch){
        var start = parseInt(rangeMatch[1], 10);
        var end = parseInt(rangeMatch[2], 10);
        if (start > end){ var t = start; start = end; end = t; }
        for (var p = start; p <= end; p++){
          if (p < 1 || p > pageCount) return { error: 'Page ' + p + ' is out of range (this PDF has ' + pageCount + ' pages).' };
          if (!seen[p]){ seen[p] = true; indices.push(p - 1); }
        }
      } else if (singleMatch){
        var n = parseInt(singleMatch[1], 10);
        if (n < 1 || n > pageCount) return { error: 'Page ' + n + ' is out of range (this PDF has ' + pageCount + ' pages).' };
        if (!seen[n]){ seen[n] = true; indices.push(n - 1); }
      } else {
        return { error: 'Could not understand "' + part + '". Use page numbers and ranges like 1-3,5,8-10.' };
      }
    }
    if (indices.length === 0) return { error: 'No valid pages were found in that input.' };
    return { indices: indices };
  }

  window.DocuPdf = {
    readAsArrayBuffer: readAsArrayBuffer,
    readAsDataURL: readAsDataURL,
    buildPdfFromImages: buildPdfFromImages,
    mergePdfFiles: mergePdfFiles,
    loadPdfDoc: loadPdfDoc,
    extractPages: extractPages,
    parsePageRanges: parsePageRanges
  };
})();
