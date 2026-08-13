/* DocuTools - Compress PDF tool.
   Mode 1 "optimize": re-saves the PDF with pdf-lib's object-stream compression. Genuine but modest.
   Mode 2 "rasterize": renders each page to a JPEG at a chosen quality/resolution and rebuilds the PDF from
   those images using pdf-lib. This can meaningfully shrink image-heavy or scanned PDFs, but converts text
   to images (it is no longer selectable/searchable). Both modes report only measured, real byte sizes. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var pageCountLine = document.getElementById('page-count-line');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var progressTrack = document.getElementById('progress-track');
    var progressFill = document.getElementById('progress-fill');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var compareTable = document.getElementById('compare-table');
    var downloadBtn = document.getElementById('download-btn');
    var modeRadios = document.querySelectorAll('input[name="compress-mode"]');
    var qualitySelect = document.getElementById('quality-select');
    var rasterOptions = document.getElementById('raster-options');
    var resultBlob = null;
    var currentFile = null;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function currentMode(){
      var checked = document.querySelector('input[name="compress-mode"]:checked');
      return checked ? checked.value : 'optimize';
    }

    function toggleRasterOptions(){
      rasterOptions.style.display = currentMode() === 'rasterize' ? 'block' : 'none';
    }
    modeRadios.forEach(function(r){ r.addEventListener('change', toggleRasterOptions); });

    function resetAll(){
      currentFile = null;
      resultBlob = null;
      input.value = '';
      renderFile(null);
      pageCountLine.style.display = 'none';
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.pdf'], acceptMime: ['application/pdf'], maxSizeMB: 80, maxFiles: 1 });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
        return;
      }
      currentFile = result.valid[0];
      renderFile(currentFile);
      convertBtn.disabled = false;
      window.DocuUtils.clearStatus(statusBox);
      window.DocuPdf.loadPdfDoc(currentFile).then(function(loaded){
        pageCountLine.style.display = 'block';
        pageCountLine.textContent = 'This PDF has ' + loaded.pageCount + ' page(s) and is currently ' + window.DocuUtils.formatBytes(currentFile.size) + '.';
      }).catch(function(){ /* page count is optional info; ignore failure here */ });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    function optimizeMode(file){
      return window.DocuPdf.readAsArrayBuffer(file).then(function(buffer){
        return window.DocuLibs.ensurePdfLib().then(function(PDFLib){
          return PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true }).then(function(doc){
            return doc.save({ useObjectStreams: true });
          });
        });
      });
    }

    function rasterizeMode(file, quality, onProgress){
      var scale = 1.5;
      return window.DocuLibs.ensurePdfJs().then(function(pdfjsLib){
        return window.DocuPdf.readAsArrayBuffer(file).then(function(buffer){
          return pdfjsLib.getDocument({ data: buffer }).promise.then(function(pdf){
            var numPages = pdf.numPages;
            var pageBlobsPromise = Promise.resolve([]);
            for (var i = 1; i <= numPages; i++){
              (function(pageNum){
                pageBlobsPromise = pageBlobsPromise.then(function(acc){
                  return pdf.getPage(pageNum).then(function(page){
                    var viewport = page.getViewport({ scale: scale });
                    var canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    var ctx = canvas.getContext('2d');
                    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function(){
                      return new Promise(function(resolve){
                        canvas.toBlob(function(blob){
                          if (onProgress) onProgress(pageNum, numPages);
                          acc.push({ blob: blob, width: canvas.width, height: canvas.height });
                          resolve(acc);
                        }, 'image/jpeg', quality);
                      });
                    });
                  });
                });
              })(i);
            }
            return pageBlobsPromise;
          });
        });
      }).then(function(pageImages){
        return window.DocuLibs.ensurePdfLib().then(function(PDFLib){
          return PDFLib.PDFDocument.create().then(function(newDoc){
            var chain = Promise.resolve();
            pageImages.forEach(function(pageImg){
              chain = chain.then(function(){
                return pageImg.blob.arrayBuffer().then(function(buf){
                  return newDoc.embedJpg(buf).then(function(image){
                    var page = newDoc.addPage([pageImg.width, pageImg.height]);
                    page.drawImage(image, { x: 0, y: 0, width: pageImg.width, height: pageImg.height });
                  });
                });
              });
            });
            return chain.then(function(){ return newDoc.save(); });
          });
        });
      });
    }

    convertBtn.addEventListener('click', function(){
      if (!currentFile) return;
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      var mode = currentMode();
      var originalSize = currentFile.size;

      if (mode === 'optimize'){
        window.DocuUtils.setStatus(statusBox, 'progress', 'Optimizing PDF...');
        optimizeMode(currentFile).then(function(bytes){ finish(bytes, originalSize, 'optimize'); }).catch(function(err){ fail(err); });
      } else {
        progressTrack.style.display = 'block';
        progressFill.style.width = '0%';
        window.DocuUtils.setStatus(statusBox, 'progress', 'Rendering pages and compressing...');
        var quality = parseFloat(qualitySelect.value);
        rasterizeMode(currentFile, quality, function(done, total){
          progressFill.style.width = Math.round((done / total) * 100) + '%';
        }).then(function(bytes){ finish(bytes, originalSize, 'rasterize'); }).catch(function(err){ fail(err); });
      }

      function fail(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not compress this PDF: ' + err.message);
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      }

      function finish(bytes, originalSize, modeUsed){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        var newSize = resultBlob.size;
        var reduction = originalSize > 0 ? Math.round((1 - (newSize / originalSize)) * 100) : 0;
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
        compareTable.innerHTML = '';
        var rows = [
          ['Original size', window.DocuUtils.formatBytes(originalSize)],
          ['New size', window.DocuUtils.formatBytes(newSize)],
          ['Change', (reduction >= 0 ? reduction + '% smaller' : (reduction * -1) + '% larger')]
        ];
        rows.forEach(function(r){
          var tr = document.createElement('tr');
          var th = document.createElement('th'); th.textContent = r[0];
          var td = document.createElement('td'); td.textContent = r[1];
          tr.appendChild(th); tr.appendChild(td);
          compareTable.appendChild(tr);
        });
        if (reduction > 0){
          window.DocuUtils.setStatus(statusBox, 'success', 'Done. The file is measurably smaller (' + reduction + '% reduction).');
        } else if (reduction === 0){
          window.DocuUtils.setStatus(statusBox, 'info', 'The file size did not meaningfully change. This PDF may already be well optimized.');
        } else {
          window.DocuUtils.setStatus(statusBox, 'info', 'This mode actually produced a larger file for this PDF (' + (reduction * -1) + '% larger). You can still download it, or try the other mode instead.');
        }
        if (modeUsed === 'rasterize'){
          resultSummary.textContent = 'Note: pages were converted to images, so text in the new PDF is no longer selectable or searchable.';
        } else {
          resultSummary.textContent = '';
        }
        resultPanel.style.display = 'block';
      }
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-compressed', 'pdf'));
    });

    resetBtn.addEventListener('click', resetAll);
    toggleRasterOptions();
    resetAll();
  });
})();
