/* DocuTools - PDF to JPG tool. Renders selected pages using PDF.js and exports JPG (or a ZIP of JPGs). */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var pageCountLine = document.getElementById('page-count-line');
    var rangeInput = document.getElementById('range-input');
    var qualitySelect = document.getElementById('quality-select');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var progressTrack = document.getElementById('progress-track');
    var progressFill = document.getElementById('progress-fill');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var downloadBtn = document.getElementById('download-btn');
    var resultBlob = null;
    var resultName = 'docutools-pages.zip';
    var currentFile = null;
    var currentPageCount = 0;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function resetAll(){
      currentFile = null;
      currentPageCount = 0;
      resultBlob = null;
      input.value = '';
      renderFile(null);
      pageCountLine.style.display = 'none';
      rangeInput.value = '';
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
      window.DocuUtils.setStatus(statusBox, 'progress', 'Reading PDF...');
      window.DocuLibs.ensurePdfJs().then(function(pdfjsLib){
        return window.DocuPdf.readAsArrayBuffer(currentFile).then(function(buffer){
          return pdfjsLib.getDocument({ data: buffer }).promise;
        });
      }).then(function(pdf){
        currentPageCount = pdf.numPages;
        pageCountLine.style.display = 'block';
        pageCountLine.textContent = 'This PDF has ' + currentPageCount + ' page(s). Leave the field blank to convert all pages.';
        convertBtn.disabled = false;
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not read this PDF: ' + err.message);
      });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (!currentFile) return;
      var indices;
      if (rangeInput.value.trim() === ''){
        indices = [];
        for (var i = 0; i < currentPageCount; i++) indices.push(i);
      } else {
        var parsed = window.DocuPdf.parsePageRanges(rangeInput.value, currentPageCount);
        if (parsed.error){ window.DocuUtils.setStatus(statusBox, 'error', parsed.error); return; }
        indices = parsed.indices;
      }

      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'block';
      progressFill.style.width = '0%';
      window.DocuUtils.setStatus(statusBox, 'progress', 'Rendering ' + indices.length + ' page(s)...');

      var quality = parseFloat(qualitySelect.value);
      var scale = 2;
      var jpgBlobs = [];

      window.DocuLibs.ensurePdfJs().then(function(pdfjsLib){
        return window.DocuPdf.readAsArrayBuffer(currentFile).then(function(buffer){
          return pdfjsLib.getDocument({ data: buffer }).promise;
        });
      }).then(function(pdf){
        var chain = Promise.resolve();
        indices.forEach(function(pageIndex, i){
          chain = chain.then(function(){
            return pdf.getPage(pageIndex + 1).then(function(page){
              var viewport = page.getViewport({ scale: scale });
              var canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              var ctx = canvas.getContext('2d');
              return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function(){
                return new Promise(function(resolve){
                  canvas.toBlob(function(blob){
                    jpgBlobs.push({ pageNumber: pageIndex + 1, blob: blob });
                    progressFill.style.width = Math.round(((i + 1) / indices.length) * 100) + '%';
                    resolve();
                  }, 'image/jpeg', quality);
                });
              });
            });
          });
        });
        return chain;
      }).then(function(){
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
        if (jpgBlobs.length === 1){
          resultBlob = jpgBlobs[0].blob;
          resultName = window.DocuUtils.safeFilename('docutools-page-' + jpgBlobs[0].pageNumber, 'jpg');
          resultSummary.textContent = 'Converted 1 page. File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
          window.DocuUtils.setStatus(statusBox, 'success', 'Done.');
          resultPanel.style.display = 'block';
        } else {
          window.DocuUtils.setStatus(statusBox, 'progress', 'Packaging ' + jpgBlobs.length + ' images into a ZIP...');
          window.DocuLibs.ensureJsZip().then(function(JSZip){
            var zip = new JSZip();
            jpgBlobs.forEach(function(item){
              zip.file('page-' + String(item.pageNumber).padStart(3, '0') + '.jpg', item.blob);
            });
            return zip.generateAsync({ type: 'blob' });
          }).then(function(zipBlob){
            resultBlob = zipBlob;
            resultName = window.DocuUtils.safeFilename('docutools-pages', 'zip');
            resultSummary.textContent = 'Converted ' + jpgBlobs.length + ' pages into a ZIP. File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
            window.DocuUtils.setStatus(statusBox, 'success', 'Done.');
            resultPanel.style.display = 'block';
          }).catch(function(err){
            window.DocuUtils.setStatus(statusBox, 'error', 'Could not package the images: ' + err.message);
          });
        }
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not convert this PDF: ' + err.message);
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, resultName);
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
