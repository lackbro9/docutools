/* DocuTools - Merge PDF tool */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var items = [];
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var progressTrack = document.getElementById('progress-track');
    var progressFill = document.getElementById('progress-fill');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var downloadBtn = document.getElementById('download-btn');
    var resultBlob = null;

    function render(){
      window.DocuComponents.renderFileList(listEl, items.map(function(it){
        return { id: it.id, label: it.file.name, sizeText: window.DocuUtils.formatBytes(it.file.size) };
      }), {
        onRemove: function(id){ items = items.filter(function(it){ return it.id !== id; }); render(); },
        onMoveUp: function(id){ items = window.DocuComponents.moveItem(items, id, -1); render(); },
        onMoveDown: function(id){ items = window.DocuComponents.moveItem(items, id, 1); render(); }
      });
      convertBtn.disabled = items.length < 2;
      if (items.length === 1){
        window.DocuUtils.setStatus(statusBox, 'info', 'Add at least one more PDF to merge.');
      }
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.pdf'], acceptMime: ['application/pdf'], maxSizeMB: 60, maxFiles: 20 });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
      } else {
        window.DocuUtils.clearStatus(statusBox);
      }
      result.valid.forEach(function(file){
        items.push({ id: window.DocuComponents.nextId(), file: file });
      });
      render();
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (items.length < 2) return;
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'block';
      progressFill.style.width = '0%';
      window.DocuUtils.setStatus(statusBox, 'progress', 'Merging ' + items.length + ' PDF files...');

      window.DocuPdf.mergePdfFiles(items.map(function(it){ return it.file; }), function(done, total){
        progressFill.style.width = Math.round((done / total) * 100) + '%';
      }).then(function(bytes){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        window.DocuUtils.setStatus(statusBox, 'success', 'Done. Merged ' + items.length + ' files into one PDF.');
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
        resultPanel.style.display = 'block';
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Merge failed: ' + err.message + ' Make sure every file is a valid, non-corrupted PDF.');
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-merged', 'pdf'));
    });

    resetBtn.addEventListener('click', function(){
      items = [];
      resultBlob = null;
      input.value = '';
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
      render();
    });

    render();
  });
})();
