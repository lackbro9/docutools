/* DocuTools - JPG to PNG tool */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var resultImg = document.getElementById('result-img');
    var downloadBtn = document.getElementById('download-btn');
    var current = null;
    var resultBlob = null;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }
    function resetAll(){
      current = null; resultBlob = null; input.value = '';
      renderFile(null); convertBtn.disabled = true; resultPanel.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
    }
    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.jpg', '.jpeg'], acceptMime: ['image/jpeg'], maxSizeMB: 25, maxFiles: 1 });
      if (result.errors.length){ window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' ')); return; }
      var file = result.valid[0];
      renderFile(file);
      window.DocuImage.loadImageElement(file).then(function(loaded){
        current = { file: file, img: loaded.img, width: loaded.width, height: loaded.height };
        convertBtn.disabled = false;
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){ window.DocuUtils.setStatus(statusBox, 'error', err.message); });
    }
    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Converting to PNG...');
      var canvas = window.DocuImage.drawToCanvas(current.img, current.width, current.height, false);
      window.DocuImage.canvasToBlob(canvas, 'image/png').then(function(blob){
        resultBlob = blob;
        resultImg.src = URL.createObjectURL(blob);
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(blob.size) + ' (PNG is lossless, so file size is often larger than the original JPG).';
        window.DocuUtils.setStatus(statusBox, 'success', 'Done.');
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
      }).catch(function(err){ window.DocuUtils.setStatus(statusBox, 'error', err.message); convertBtn.disabled = false; });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-image', 'png'));
    });
    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
