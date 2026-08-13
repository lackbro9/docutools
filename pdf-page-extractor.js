/* DocuTools - PDF Page Extractor: pick individual pages via checkboxes */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var pageCountLine = document.getElementById('page-count-line');
    var pageGrid = document.getElementById('page-grid');
    var selectAllBtn = document.getElementById('select-all-btn');
    var selectNoneBtn = document.getElementById('select-none-btn');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var downloadBtn = document.getElementById('download-btn');
    var resultBlob = null;
    var current = null;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function buildGrid(pageCount){
      pageGrid.textContent = '';
      pageGrid.style.display = 'flex';
      for (var i = 1; i <= pageCount; i++){
        var id = 'page-cb-' + i;
        var label = document.createElement('label');
        label.className = 'page-chip';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = id;
        cb.value = String(i);
        cb.addEventListener('change', updateButtonState);
        label.appendChild(cb);
        var span = document.createElement('span');
        span.textContent = 'Page ' + i;
        label.appendChild(span);
        pageGrid.appendChild(label);
      }
    }

    function getSelectedIndices(){
      var boxes = pageGrid.querySelectorAll('input[type="checkbox"]:checked');
      var nums = Array.prototype.map.call(boxes, function(b){ return parseInt(b.value, 10); });
      nums.sort(function(a, b){ return a - b; });
      return nums.map(function(n){ return n - 1; });
    }

    function updateButtonState(){
      convertBtn.disabled = !current || getSelectedIndices().length === 0;
    }

    function resetAll(){
      current = null;
      resultBlob = null;
      input.value = '';
      renderFile(null);
      pageCountLine.style.display = 'none';
      pageGrid.style.display = 'none';
      pageGrid.textContent = '';
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.pdf'], acceptMime: ['application/pdf'], maxSizeMB: 80, maxFiles: 1 });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
        return;
      }
      var file = result.valid[0];
      renderFile(file);
      window.DocuUtils.setStatus(statusBox, 'progress', 'Reading PDF...');
      window.DocuPdf.loadPdfDoc(file).then(function(loaded){
        current = { file: file, PDFLib: loaded.PDFLib, doc: loaded.doc, pageCount: loaded.pageCount };
        pageCountLine.style.display = 'block';
        pageCountLine.textContent = 'This PDF has ' + loaded.pageCount + ' page(s). Check the pages you want to keep.';
        buildGrid(loaded.pageCount);
        updateButtonState();
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not read this PDF: ' + err.message);
      });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    selectAllBtn.addEventListener('click', function(){
      pageGrid.querySelectorAll('input[type="checkbox"]').forEach(function(cb){ cb.checked = true; });
      updateButtonState();
    });
    selectNoneBtn.addEventListener('click', function(){
      pageGrid.querySelectorAll('input[type="checkbox"]').forEach(function(cb){ cb.checked = false; });
      updateButtonState();
    });

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      var indices = getSelectedIndices();
      if (indices.length === 0) return;
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Building your PDF...');
      window.DocuPdf.extractPages(current.PDFLib, current.doc, indices).then(function(bytes){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        window.DocuUtils.setStatus(statusBox, 'success', 'Done. New PDF has ' + indices.length + ' page(s).');
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not extract pages: ' + err.message);
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-extracted', 'pdf'));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
