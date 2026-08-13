/* DocuTools - JPG to PDF tool */
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
        return { id: it.id, label: it.file.name, sizeText: window.DocuUtils.formatBytes(it.file.size), thumbSrc: it.thumbSrc };
      }), {
        onRemove: function(id){ items = items.filter(function(it){ return it.id !== id; }); render(); },
        onMoveUp: function(id){ items = window.DocuComponents.moveItem(items, id, -1); render(); },
        onMoveDown: function(id){ items = window.DocuComponents.moveItem(items, id, 1); render(); }
      });
      convertBtn.disabled = items.length === 0;
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.jpg', '.jpeg'], acceptMime: ['image/jpeg'], maxSizeMB: 25, maxFiles: 30 });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
      } else {
        window.DocuUtils.clearStatus(statusBox);
      }
      result.valid.forEach(function(file){
        var id = window.DocuComponents.nextId();
        items.push({ id: id, file: file, thumbSrc: null });
        window.DocuPdf.readAsDataURL(file).then(function(dataUrl){
          var found = items.find(function(it){ return it.id === id; });
          if (found){ found.thumbSrc = dataUrl; render(); }
        });
      });
      render();
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (items.length === 0) return;
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      progressTrack.style.display = 'block';
      progressFill.style.width = '0%';
      window.DocuUtils.setStatus(statusBox, 'progress', 'Converting ' + items.length + ' image(s) to PDF...');

      window.DocuPdf.buildPdfFromImages(items.map(function(it){ return it.file; }), function(done, total){
        progressFill.style.width = Math.round((done / total) * 100) + '%';
      }).then(function(bytes){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        window.DocuUtils.setStatus(statusBox, 'success', 'Done. Your PDF has ' + items.length + ' page(s).');
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
        resultPanel.style.display = 'block';
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Conversion failed: ' + err.message);
        progressTrack.style.display = 'none';
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-images', 'pdf'));
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
