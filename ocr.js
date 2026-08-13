/* DocuTools - OCR tool using Tesseract.js. Runs entirely on-device; no image is sent to an external OCR API. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var previewImg = document.getElementById('preview-img');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var progressTrack = document.getElementById('progress-track');
    var progressFill = document.getElementById('progress-fill');
    var resultPanel = document.getElementById('result-panel');
    var outputArea = document.getElementById('output-text');
    var downloadBtn = document.getElementById('download-btn');
    var current = null;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function resetAll(){
      current = null;
      input.value = '';
      renderFile(null);
      previewImg.style.display = 'none';
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'none';
      outputArea.value = '';
      window.DocuUtils.clearStatus(statusBox);
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, {
        acceptExt: ['.jpg', '.jpeg', '.png', '.webp'],
        acceptMime: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeMB: 15, maxFiles: 1
      });
      if (result.errors.length){ window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' ')); return; }
      current = result.valid[0];
      renderFile(current);
      previewImg.src = URL.createObjectURL(current);
      previewImg.style.display = 'block';
      convertBtn.disabled = false;
      window.DocuUtils.clearStatus(statusBox);
    }
    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    /* Re-wrap the File as a plain Blob built from its raw bytes before handing it to Tesseract.
       Some File objects (depending on how they were created) are not read reliably by the
       recognition engine's internal image loader; rebuilding a fresh Blob from the same bytes
       avoids that failure mode while keeping the exact original image data. */
    function toFreshImageBlob(file){
      return file.arrayBuffer().then(function(buf){
        return new Blob([buf], { type: file.type || 'image/png' });
      });
    }

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      convertBtn.disabled = true;
      progressTrack.style.display = 'block';
      progressFill.style.width = '0%';
      window.DocuUtils.setStatus(statusBox, 'progress', 'Loading OCR engine...');

      window.DocuLibs.ensureTesseract().then(function(Tesseract){
        return toFreshImageBlob(current).then(function(imageBlob){
          return Tesseract.recognize(imageBlob, 'eng', {
            logger: function(m){
              if (m.status && typeof m.progress === 'number'){
                progressFill.style.width = Math.round(m.progress * 100) + '%';
                window.DocuUtils.setStatus(statusBox, 'progress', m.status.replace(/_/g, ' ') + '...');
              }
            }
          });
        });
      }).then(function(res){
        var text = (res && res.data && res.data.text) ? res.data.text.trim() : '';
        outputArea.value = text;
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
        resultPanel.style.display = 'block';
        if (text.length === 0){
          window.DocuUtils.setStatus(statusBox, 'info', 'No text was recognized in this image.');
        } else {
          window.DocuUtils.setStatus(statusBox, 'success', 'Done. Recognized ' + text.length + ' characters.');
        }
      }).catch(function(err){
        var message = (err && err.message) ? err.message : String(err);
        window.DocuUtils.setStatus(statusBox, 'error', 'OCR failed: ' + message);
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      var blob = new Blob([outputArea.value], { type: 'text/plain' });
      window.DocuUtils.triggerDownload(blob, window.DocuUtils.safeFilename('docutools-ocr-text', 'txt'));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
