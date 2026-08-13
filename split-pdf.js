/* DocuTools - Split PDF tool: extract a page range into a new PDF */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var pageCountLine = document.getElementById('page-count-line');
    var rangeInput = document.getElementById('range-input');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var downloadBtn = document.getElementById('download-btn');
    var resultBlob = null;
    var current = null; /* { file, PDFLib, doc, pageCount } */

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); },
        onMoveUp: function(){},
        onMoveDown: function(){}
      });
    }

    function resetAll(){
      current = null;
      resultBlob = null;
      input.value = '';
      renderFile(null);
      pageCountLine.style.display = 'none';
      rangeInput.value = '';
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
        pageCountLine.textContent = 'This PDF has ' + loaded.pageCount + ' page(s). Enter the pages you want below.';
        convertBtn.disabled = false;
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not read this PDF: ' + err.message);
      });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      var parsed = window.DocuPdf.parsePageRanges(rangeInput.value, current.pageCount);
      if (parsed.error){
        window.DocuUtils.setStatus(statusBox, 'error', parsed.error);
        return;
      }
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Building your PDF...');
      window.DocuPdf.extractPages(current.PDFLib, current.doc, parsed.indices).then(function(bytes){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        window.DocuUtils.setStatus(statusBox, 'success', 'Done. New PDF has ' + parsed.indices.length + ' page(s).');
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not split this PDF: ' + err.message);
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-split', 'pdf'));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
